import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMerchants } from '../context/MerchantContext';
import './AddMerchant.css';

function AddMerchant() {
    const navigate = useNavigate();
    const { addMerchant } = useMerchants();

    const [showBank, setShowBank] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        bank: '',
        initialTransaction: ''
    });

    const [errors, setErrors] = useState({});

    const getMaskedBank = (raw) => {
        if (!raw) return "";
        if (raw.length <= 4) return raw;
        return "*".repeat(raw.length - 4) + raw.slice(-4);
    };

    const handleBankChange = (e) => {
        const inputVal = e.target.value;
        const currentMaskedDisplay = getMaskedBank(formData.bank);
        let newRaw = formData.bank;

        if (showBank) {
            newRaw = inputVal.replace(/\D/g, '');
        } else {
            if (!inputVal.includes('*')) {
                newRaw = inputVal.replace(/\D/g, '');
            } else {
                const diff = inputVal.length - currentMaskedDisplay.length;
                if (diff === 1) {
                    const char = inputVal.slice(-1);
                    if (/\d/.test(char)) newRaw += char;
                } else if (diff === -1) {
                    newRaw = newRaw.slice(0, -1);
                } else if (diff < -1) {
                    newRaw = newRaw.slice(0, diff);
                } else if (diff > 1) {
                    const newlyAdded = inputVal.slice(currentMaskedDisplay.length).replace(/\D/g, '');
                    newRaw += newlyAdded;
                }
            }
        }

        if (newRaw.length > 19) newRaw = newRaw.slice(0, 19);

        setFormData(prev => ({ ...prev, bank: newRaw }));
        if (errors.bank) {
            setErrors(prev => ({ ...prev, bank: '' }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'bank') {
            handleBankChange(e);
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Merchant Name is required';

        if (!formData.bank) {
            newErrors.bank = 'Account Number is required';
        } else if (formData.bank.length < 11 || formData.bank.length > 19) {
            newErrors.bank = 'Account Number must be between 11 and 19 digits';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Generate random ID for new merchant
        const newId = `M${Math.floor(Math.random() * 900 + 100)}`;

        // Construct new merchant object
        const initialAmount = Number(formData.initialTransaction || 0);
        const initialFee = initialAmount ? Math.round(initialAmount * 0.03) : 0;
        const newMerchant = {
            id: newId,
            name: formData.name,
            bank: `****${formData.bank.slice(-4)}`, // Store matching earlier data format
            profit: Math.max(initialAmount - initialFee, 0),
            flagged: false,
            bankMismatch: false,
            transactions: formData.initialTransaction ? [
                { id: 1, amount: initialAmount, fee: initialFee, refund: 0 }
            ] : []
        };

        addMerchant(newMerchant);

        // Redirect back to merchants list
        navigate('/merchants');
    };

    return (
        <div className="add-merchant-page">
            <div className="form-container">
                <h2>Add New Merchant</h2>
                <p className="form-subtitle">Register a new merchant into the settlement system</p>

                <form onSubmit={handleSubmit} className="merchant-form">
                    <div className="form-group">
                        <label htmlFor="name">Merchant Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. ABC Tech Solutions"
                            className={errors.name ? 'error-input' : ''}
                        />
                        {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="bank">Account Number (11-19 digits)</label>
                        <div className="input-with-icon">
                            <input
                                type="text"
                                id="bank"
                                name="bank"
                                value={showBank ? formData.bank : getMaskedBank(formData.bank)}
                                onChange={handleChange}
                                placeholder="e.g. *********1234"
                                maxLength={showBank ? "19" : "30"}
                                className={errors.bank ? 'error-input' : ''}
                            />
                            <button
                                type="button"
                                className="eye-icon-btn"
                                onClick={() => setShowBank(!showBank)}
                                aria-label={showBank ? "Hide account number" : "Show account number"}
                            >
                                {showBank ? "Hide" : "Show"}
                            </button>
                        </div>
                        {errors.bank && <span className="error-text">{errors.bank}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="initialTransaction">Initial Test Transaction Amount ($)</label>
                        <input
                            type="number"
                            id="initialTransaction"
                            name="initialTransaction"
                            value={formData.initialTransaction}
                            onChange={handleChange}
                            placeholder="Optional"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit">
                            Register Merchant
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddMerchant;
