// ConfirmationDialog.jsx
import React from 'react';

export default function ConfirmationDialog({
    isOpen,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    onConfirm,
    onCancel
}) {
    // If the state is false, do not render anything in the DOM
    if (!isOpen) return null;

    return (
        <div className="overlay">
            <div className='confirm-dialog' role="alertdialog" aria-modal="true">
                <h3 className='dialog-title' >{title}</h3>
                <p className='dialog-message' >{message}</p>
                <div className='dialog-actions' >
                    <button className='dialog-cancel' onClick={onCancel}>
                        Cancel
                    </button>
                    <button className='dialog-confirm' onClick={onConfirm}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
