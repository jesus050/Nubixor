-- Los resultados ya sellados tampoco se editan ni se eliminan. Para repetir
-- una comprobación se genera una ejecución nueva.

CREATE TRIGGER audit_control_runs_append_only
BEFORE UPDATE OR DELETE ON audit_control_runs
FOR EACH ROW
EXECUTE FUNCTION reject_audit_event_mutation();

