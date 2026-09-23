// frontend/src/components/FileUpload.jsx
import React, { useState } from 'react';
import api from '../services/api';

function FileUpload({ onSuccess }) {
    const [caseName, setCaseName] = useState('');
    const [description, setDescription] = useState('');
    const [fraudAmount, setFraudAmount] = useState('');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFiles([...e.target.files]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('case_name', caseName);
        formData.append('description', description);
        formData.append('fraud_amount', fraudAmount);
        
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            await api.post('/api/cases', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            // Reset form
            setCaseName('');
            setDescription('');
            setFraudAmount('');
            setFiles([]);
            
            onSuccess();
        } catch (err) {
            setError('Error creating case. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="file-upload">
            <h3>Create New Case</h3>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Case Name</label>
                    <input
                        type="text"
                        value={caseName}
                        onChange={(e) => setCaseName(e.target.value)}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                
                <div className="form-group">
                    <label>Fraud Amount (₹)</label>
                    <input
                        type="number"
                        value={fraudAmount}
                        onChange={(e) => setFraudAmount(e.target.value)}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label>Evidence Files</label>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        accept=".pdf,.xlsx,.csv,.txt,.jpg,.png"
                    />
                    {files.length > 0 && (
                        <p>{files.length} file(s) selected</p>
                    )}
                </div>
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Case'}
                </button>
            </form>
        </div>
    );
}

export default FileUpload;