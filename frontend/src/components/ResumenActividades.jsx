import { useMemo } from "react";
import './styles/ResumenActividades.css'

export const ResumenActividades = ({ actividades = [] }) => {

    // Función para formatear
    const formatoTiempo = (mins) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    const totales = useMemo(() => {
        // 1. Calculamos los acumulados base
        const base = actividades.reduce((acc, act) => {
            acc.planeado += Number(act.minutos_planeados) || 0;
            acc.ejecutado += Number(act.minutos_ejecutados) || 0;
            return acc;
        }, { planeado: 0, ejecutado: 0 });

        // 2. Calculamos la diferencia basándonos en el resultado anterior
        const diferencia = base.planeado - base.ejecutado;

        // 3. Retornamos el objeto completo
        return {
            planeado: base.planeado,
            ejecutado: base.ejecutado,
            diferencia: diferencia
        };
    }, [actividades]);

    return (
        <div className="resumen-totales-footer">
            <div><strong>Total Planeado:</strong> {formatoTiempo(totales.planeado)}</div>
            <div><strong>Total Ejecutado:</strong> {formatoTiempo(totales.ejecutado)}</div>
            <div className={`diferencia-box ${totales.diferencia < 0 ? 'exceso' : 'ahorro'}`}>
                <strong>Diferencia</strong>
                <span>{formatoTiempo(Math.abs(totales.diferencia))}</span>
            </div>
        </div>
    );
};