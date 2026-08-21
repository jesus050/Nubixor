import sys
import os
import struct
import zlib
import subprocess

def unfilter_scanline(filter_type, scanline, prev_scanline, bpp):
    result = bytearray(len(scanline))
    if filter_type == 0:  # None
        result[:] = scanline
    elif filter_type == 1:  # Sub
        for i in range(len(scanline)):
            left = result[i - bpp] if i >= bpp else 0
            result[i] = (scanline[i] + left) & 0xFF
    elif filter_type == 2:  # Up
        for i in range(len(scanline)):
            up = prev_scanline[i] if prev_scanline else 0
            result[i] = (scanline[i] + up) & 0xFF
    elif filter_type == 3:  # Average
        for i in range(len(scanline)):
            left = result[i - bpp] if i >= bpp else 0
            up = prev_scanline[i] if prev_scanline else 0
            result[i] = (scanline[i] + ((left + up) >> 1)) & 0xFF
    elif filter_type == 4:  # Paeth
        for i in range(len(scanline)):
            a = result[i - bpp] if i >= bpp else 0
            b = prev_scanline[i] if prev_scanline else 0
            c = prev_scanline[i - bpp] if (prev_scanline and i >= bpp) else 0
            p = a + b - c
            pa = abs(p - a)
            pb = abs(p - b)
            pc = abs(p - c)
            if pa <= pb and pa <= pc:
                pr = a
            elif pb <= pc:
                pr = b
            else:
                pr = c
            result[i] = (scanline[i] + pr) & 0xFF
    else:
        raise ValueError(f"Unknown filter type {filter_type}")
    return result

def read_png_rgba(file_path):
    with open(file_path, 'rb') as f:
        data = f.read()

    assert data[:8] == b'\x89PNG\r\n\x1a\n', "Invalid PNG signature"
    pos = 8
    width = height = bit_depth = color_type = None
    idat_chunks = []
    
    while pos < len(data):
        length = struct.unpack('>I', data[pos:pos+4])[0]
        ctype = data[pos+4:pos+8]
        cdata = data[pos+8:pos+8+length]
        pos += 12 + length
        if ctype == b'IHDR':
            width, height, bit_depth, color_type, comp, filt, inter = struct.unpack('>IIBBBBB', cdata)
        elif ctype == b'IDAT':
            idat_chunks.append(cdata)
        elif ctype == b'IEND':
            break

    decomp = zlib.decompress(b''.join(idat_chunks))
    
    if color_type == 2:  # RGB
        bpp = 3
    elif color_type == 6:  # RGBA
        bpp = 4
    else:
        raise ValueError(f"Unsupported color type: {color_type}")

    stride = width * bpp
    raw_rgba = bytearray(width * height * 4)
    
    decomp_pos = 0
    prev_unfiltered = None
    for y in range(height):
        ftype = decomp[decomp_pos]
        scanline = decomp[decomp_pos+1 : decomp_pos+1+stride]
        decomp_pos += 1 + stride
        unfiltered = unfilter_scanline(ftype, scanline, prev_unfiltered, bpp)
        prev_unfiltered = unfiltered
        
        row_out_offset = y * width * 4
        if color_type == 2:
            for x in range(width):
                r = unfiltered[x * 3]
                g = unfiltered[x * 3 + 1]
                b = unfiltered[x * 3 + 2]
                idx = row_out_offset + x * 4
                raw_rgba[idx] = r
                raw_rgba[idx + 1] = g
                raw_rgba[idx + 2] = b
                raw_rgba[idx + 3] = 255
        elif color_type == 6:
            raw_rgba[row_out_offset : row_out_offset + width * 4] = unfiltered

    return width, height, raw_rgba

def write_png_rgba(file_path, width, height, rgba_data):
    raw_lines = bytearray()
    row_bytes = width * 4
    for y in range(height):
        raw_lines.append(0)  # Filter type 0: None
        raw_lines.extend(rgba_data[y * row_bytes : (y + 1) * row_bytes])

    compressed = zlib.compress(bytes(raw_lines), 9)

    out = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    out.extend(struct.pack('>I', len(ihdr_data)))
    out.extend(b'IHDR')
    out.extend(ihdr_data)
    out.extend(struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xFFFFFFFF))
    
    # IDAT
    out.extend(struct.pack('>I', len(compressed)))
    out.extend(b'IDAT')
    out.extend(compressed)
    out.extend(struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xFFFFFFFF))
    
    # IEND
    out.extend(struct.pack('>I', 0))
    out.extend(b'IEND')
    out.extend(struct.pack('>I', zlib.crc32(b'IEND') & 0xFFFFFFFF))

    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    with open(file_path, 'wb') as f:
        f.write(out)

def crop_rgba(width, height, rgba, x0, y0, x1, y1):
    new_w = x1 - x0
    new_h = y1 - y0
    new_rgba = bytearray(new_w * new_h * 4)
    for y in range(new_h):
        src_y = y0 + y
        if 0 <= src_y < height:
            src_start = (src_y * width + x0) * 4
            src_end = (src_y * width + x1) * 4
            dst_start = y * new_w * 4
            dst_end = dst_start + new_w * 4
            new_rgba[dst_start:dst_end] = rgba[src_start:src_end]
    return new_w, new_h, new_rgba

def make_transparent(width, height, rgba_data, white_threshold=246, blend_range=24):
    out = bytearray(rgba_data)
    for i in range(0, len(out), 4):
        r, g, b, a = out[i], out[i+1], out[i+2], out[i+3]
        min_val = min(r, g, b)
        # If very close to white
        if min_val >= white_threshold:
            diff = (r + g + b) / 3.0
            if diff >= 253:
                out[i+3] = 0
            else:
                alpha = int(255 * (255 - diff) / (255 - white_threshold))
                out[i+3] = max(0, min(255, alpha))
        elif min_val >= (white_threshold - blend_range):
            diff = (r + g + b) / 3.0
            factor = (255 - diff) / (blend_range + (255 - white_threshold))
            out[i+3] = max(0, min(255, int(255 * factor)))
    return out

def find_bounds(width, height, rgba, threshold=245):
    min_x, max_x = width, 0
    min_y, max_y = height, 0
    for y in range(height):
        for x in range(width):
            idx = (y * width + x) * 4
            r, g, b, a = rgba[idx], rgba[idx+1], rgba[idx+2], rgba[idx+3]
            if min(r, g, b) < threshold or (a < 250 and a > 0):
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
    return min_x, min_y, max_x + 1, max_y + 1

def main():
    input_file = sys.argv[1]
    width, height, rgba = read_png_rgba(input_file)
    print(f"Loaded image: {width}x{height}")

    # 1. Whole logo bounds
    min_x, min_y, max_x, max_y = find_bounds(width, height, rgba)
    print(f"Content bounds: ({min_x}, {min_y}) to ({max_x}, {max_y}) [Size: {max_x - min_x}x{max_y - min_y}]")

    # Add small padding
    pad = 16
    x0 = max(0, min_x - pad)
    y0 = max(0, min_y - pad)
    x1 = min(width, max_x + pad)
    y1 = min(height, max_y + pad)

    # 2. Full logo cropped
    full_w, full_h, full_rgba = crop_rgba(width, height, rgba, x0, y0, x1, y1)
    full_trans = make_transparent(full_w, full_h, full_rgba)

    # 3. Cloud icon bounds (left side)
    # Find separation between icon and "Nubixor" text
    best_split_x = 380
    min_col_activity = 999999
    for x in range(320, 440):
        activity = sum(1 for y in range(height) if min(rgba[(y*width + x)*4 : (y*width + x)*4 + 3]) < 240)
        if activity < min_col_activity:
            min_col_activity = activity
            best_split_x = x

    print(f"Identified icon/text split column: x={best_split_x}")

    # Cloud icon bounds
    icon_min_x, icon_min_y, icon_max_x, icon_max_y = find_bounds(best_split_x, height, rgba)
    icon_w = icon_max_x - icon_min_x
    icon_h = icon_max_y - icon_min_y
    max_dim = max(icon_w, icon_h)
    icon_pad = int(max_dim * 0.08)
    target_dim = max_dim + icon_pad * 2

    cx = (icon_min_x + icon_max_x) // 2
    cy = (icon_min_y + icon_max_y) // 2
    
    icon_x0 = max(0, cx - target_dim // 2)
    icon_y0 = max(0, cy - target_dim // 2)
    icon_x1 = min(width, icon_x0 + target_dim)
    icon_y1 = min(height, icon_y0 + target_dim)

    ic_w, ic_h, ic_rgba = crop_rgba(width, height, rgba, icon_x0, icon_y0, icon_x1, icon_y1)
    ic_trans = make_transparent(ic_w, ic_h, ic_rgba)

    dest_dirs = [
        "/Users/jesusdiaz/Documents/Nubixor/design-system-pack/brand",
        "/Users/jesusdiaz/Documents/Nubixor/public/assets/brand"
    ]

    for d in dest_dirs:
        os.makedirs(d, exist_ok=True)
        # Full official logo
        write_png_rgba(f"{d}/nubixor-official-logo.png", full_w, full_h, full_rgba)
        write_png_rgba(f"{d}/nubixor-logo.png", full_w, full_h, full_trans)
        write_png_rgba(f"{d}/nubixor-logo-transparent.png", full_w, full_h, full_trans)
        
        # Icon
        write_png_rgba(f"{d}/nubixor-icon.png", ic_w, ic_h, ic_trans)
        write_png_rgba(f"{d}/nubixor-icon-white-bg.png", ic_w, ic_h, ic_rgba)

    print("Generated base brand assets successfully!")

    icon_path = "/Users/jesusdiaz/Documents/Nubixor/design-system-pack/brand/nubixor-icon.png"
    sizes = [16, 32, 48, 64, 128, 192, 256, 512]
    for size in sizes:
        for d in dest_dirs:
            out_file = f"{d}/favicon-{size}x{size}.png"
            subprocess.run(["sips", "-z", str(size), str(size), icon_path, "--out", out_file], capture_output=True)
            if size == 32:
                subprocess.run(["sips", "-z", "32", "32", icon_path, "--out", f"{d}/favicon.ico"], capture_output=True)
            if size == 192:
                subprocess.run(["sips", "-z", "192", "192", icon_path, "--out", f"{d}/apple-touch-icon.png"], capture_output=True)

    print("All favicons and resized icons created successfully!")

if __name__ == "__main__":
    main()
