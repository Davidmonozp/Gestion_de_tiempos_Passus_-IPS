import React, { useState } from 'react';
import './styles/FloatingTimer.css';

export const FloatingTimer = ({ tiempoTranscurrido, jornadaActiva }) => {
    if (!jornadaActiva) return null;

    return (
        <div className="ft-floating-container">
            <div className="ft-info-badge">
                <div className="ft-icon-box">
                    <i className="fa-solid fa-stopwatch fa-spin"></i>
                </div>
                <div className="ft-time-box">
                    <small>TIEMPO ACTIVO</small>
                    <span>{tiempoTranscurrido}</span>
                </div>
            </div>
        </div>
    );
};