-- Las referencias privadas existen desde 048; estas URL internas permiten que
-- la interfaz abra el PDF/XML de la nota sin exponer almacenamiento público.
ALTER TABLE electronic_adjustment_notes
  ADD COLUMN pdf_url TEXT,
  ADD COLUMN xml_url TEXT;
