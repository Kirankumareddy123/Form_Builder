class FormBuilder {
    constructor() {
        this.fields = [];
        this.selectedField = null;
        this.fieldIdCounter = 0;
        this.uploadedFiles = {};
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.renderFields();
        this.updateFieldCount();
    }

    setupEventListeners() {
        const toolboxItems = document.querySelectorAll('.toolbox-item');
        const dropZone = document.getElementById('dropZone');
        
        toolboxItems.forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
        });

        dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));

        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveForm());
        document.getElementById('previewBtn').addEventListener('click', () => this.showPreview());
        document.getElementById('closePreview').addEventListener('click', () => this.closePreview());
        document.getElementById('closePreviewBtn').addEventListener('click', () => this.closePreview());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportHTML());
    }

    handleDragStart(e) {
        const fieldType = e.target.dataset.fieldType;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('fieldType', fieldType);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        document.getElementById('dropZone').classList.add('drag-over');
    }

    handleDragLeave(e) {
        if (e.target.id === 'dropZone') {
            document.getElementById('dropZone').classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('dropZone').classList.remove('drag-over');
        
        const fieldType = e.dataTransfer.getData('fieldType');
        if (fieldType) {
            this.createField(fieldType);
        }
    }

    createField(type) {
        const field = {
            id: `field_${this.fieldIdCounter++}`,
            type: type,
            label: this.getDefaultLabel(type),
            placeholder: this.getDefaultPlaceholder(type),
            required: false,
            options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2', 'Option 3'] : []
        };

        this.fields.push(field);
        this.renderFields();
        this.updateFieldCount();
        this.saveToStorage();
    }

    getDefaultLabel(type) {
        const labels = {
            text: 'Text Input',
            email: 'Email Address',
            number: 'Number',
            tel: 'Phone Number',
            textarea: 'Message',
            checkbox: 'Checkbox Option',
            radio: 'Radio Option',
            select: 'Select Option',
            date: 'Date',
            file: 'File Upload'
        };
        return labels[type] || 'Field Label';
    }

    getDefaultPlaceholder(type) {
        const placeholders = {
            text: 'Enter text...',
            email: 'Enter email address...',
            number: 'Enter number...',
            tel: 'Enter phone number...',
            textarea: 'Enter your message...',
            date: 'Select date...',
            file: 'Choose file...'
        };
        return placeholders[type] || '';
    }

    renderFields() {
        const dropZone = document.getElementById('dropZone');
        const emptyState = dropZone.querySelector('.empty-state');
        
        if (this.fields.length === 0) {
            if (!emptyState) {
                dropZone.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📋</div>
                        <p>Drag and drop fields here to build your form</p>
                    </div>
                `;
            }
            return;
        }

        if (emptyState) {
            emptyState.remove();
        }

        dropZone.innerHTML = this.fields.map(field => this.renderField(field)).join('');
        this.attachFieldEventListeners();
    }

    renderField(field) {
        let fieldHTML = '';

        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
            case 'tel':
            case 'date':
                fieldHTML = `<input type="${field.type}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>`;
                break;
            case 'textarea':
                fieldHTML = `<textarea placeholder="${field.placeholder}" ${field.required ? 'required' : ''}></textarea>`;
                break;
            case 'checkbox':
                fieldHTML = `
                    <div class="checkbox-group">
                        <div class="checkbox-item">
                            <input type="checkbox" id="${field.id}_cb" ${field.required ? 'required' : ''}>
                            <label for="${field.id}_cb">${field.label}</label>
                        </div>
                    </div>
                `;
                break;
            case 'radio':
                fieldHTML = `
                    <div class="radio-group">
                        ${field.options.map((option, index) => `
                            <div class="radio-item">
                                <input type="radio" name="${field.id}" id="${field.id}_${index}" ${field.required ? 'required' : ''}>
                                <label for="${field.id}_${index}">${option}</label>
                            </div>
                        `).join('')}
                    </div>
                `;
                break;
            case 'select':
                fieldHTML = `
                    <select ${field.required ? 'required' : ''}>
                        <option value="">Select an option</option>
                        ${field.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                    </select>
                `;
                break;
            case 'file':
                fieldHTML = `
                    <div class="file-upload-wrapper" data-field-id="${field.id}">
                        <div class="file-upload-zone" id="upload_${field.id}">
                            <input type="file" id="file_${field.id}" ${field.required ? 'required' : ''} multiple>
                            <div class="upload-icon">📁</div>
                            <div class="upload-text">Click to browse or drag files here</div>
                            <div class="upload-hint">Supports all file types</div>
                        </div>
                        <div class="file-preview-container" id="preview_${field.id}"></div>
                    </div>
                `;
                break;
        }

        return `
            <div class="form-field" data-field-id="${field.id}" draggable="true">
                <div class="field-header">
                    <span class="field-type-badge">${field.type}</span>
                    <div class="field-actions">
                        <button class="field-action-btn edit" title="Edit">⚙️</button>
                        <button class="field-action-btn delete" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="field-content">
                    ${field.type !== 'checkbox' ? `<label>${field.label}${field.required ? ' *' : ''}</label>` : ''}
                    ${fieldHTML}
                </div>
            </div>
        `;
    }

    attachFieldEventListeners() {
        const fieldElements = document.querySelectorAll('.form-field');
        
        fieldElements.forEach(element => {
            element.addEventListener('dragstart', (e) => this.handleFieldDragStart(e));
            element.addEventListener('dragover', (e) => this.handleFieldDragOver(e));
            element.addEventListener('drop', (e) => this.handleFieldDrop(e));
            element.addEventListener('dragend', (e) => this.handleFieldDragEnd(e));

            const editBtn = element.querySelector('.edit');
            const deleteBtn = element.querySelector('.delete');

            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectField(element.dataset.fieldId);
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteField(element.dataset.fieldId);
            });

            element.addEventListener('click', () => {
                this.selectField(element.dataset.fieldId);
            });
        });

        this.setupFileUploadListeners();
    }

    handleFieldDragStart(e) {
        e.stopPropagation();
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('fieldId', e.target.dataset.fieldId);
    }

    handleFieldDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        const dragging = document.querySelector('.dragging');
        const afterElement = this.getDragAfterElement(e.clientY);
        
        if (afterElement == null) {
            document.getElementById('dropZone').appendChild(dragging);
        } else {
            document.getElementById('dropZone').insertBefore(dragging, afterElement);
        }
    }

    handleFieldDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.reorderFields();
    }

    handleFieldDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    getDragAfterElement(y) {
        const draggableElements = [...document.querySelectorAll('.form-field:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    reorderFields() {
        const fieldElements = document.querySelectorAll('.form-field');
        const newOrder = [];
        
        fieldElements.forEach(element => {
            const field = this.fields.find(f => f.id === element.dataset.fieldId);
            if (field) {
                newOrder.push(field);
            }
        });
        
        this.fields = newOrder;
        this.saveToStorage();
    }

    selectField(fieldId) {
        document.querySelectorAll('.form-field').forEach(el => el.classList.remove('selected'));
        const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
        if (fieldElement) {
            fieldElement.classList.add('selected');
        }

        this.selectedField = this.fields.find(f => f.id === fieldId);
        this.showProperties();
    }

    showProperties() {
        const propertiesContent = document.getElementById('propertiesContent');
        
        if (!this.selectedField) {
            propertiesContent.innerHTML = `
                <div class="no-selection">
                    <p>Select a field to edit its properties</p>
                </div>
            `;
            return;
        }

        const field = this.selectedField;
        let optionsHTML = '';

        if (field.type === 'select' || field.type === 'radio') {
            optionsHTML = `
                <div class="property-group">
                    <label>Options (one per line)</label>
                    <textarea id="fieldOptions" rows="5">${field.options.join('\n')}</textarea>
                </div>
            `;
        }

        propertiesContent.innerHTML = `
            <div class="property-group">
                <label>Field Label</label>
                <input type="text" id="fieldLabel" value="${field.label}">
            </div>
            ${field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'select' && field.type !== 'file' ? `
                <div class="property-group">
                    <label>Placeholder</label>
                    <input type="text" id="fieldPlaceholder" value="${field.placeholder}">
                </div>
            ` : ''}
            ${optionsHTML}
            <div class="checkbox-property">
                <input type="checkbox" id="fieldRequired" ${field.required ? 'checked' : ''}>
                <label for="fieldRequired">Required Field</label>
            </div>
            <button class="btn btn-primary" id="updateFieldBtn" style="width: 100%; margin-top: 10px;">✅ Update Field</button>
        `;

        document.getElementById('updateFieldBtn').addEventListener('click', () => this.updateField());
    }

    updateField() {
        if (!this.selectedField) return;

        const labelInput = document.getElementById('fieldLabel');
        const placeholderInput = document.getElementById('fieldPlaceholder');
        const requiredInput = document.getElementById('fieldRequired');
        const optionsInput = document.getElementById('fieldOptions');

        this.selectedField.label = labelInput.value;
        if (placeholderInput) {
            this.selectedField.placeholder = placeholderInput.value;
        }
        this.selectedField.required = requiredInput.checked;
        
        if (optionsInput) {
            this.selectedField.options = optionsInput.value.split('\n').filter(opt => opt.trim() !== '');
        }

        this.renderFields();
        this.saveToStorage();
        this.showNotification('Field updated successfully!');
    }

    deleteField(fieldId) {
        if (confirm('Are you sure you want to delete this field?')) {
            this.fields = this.fields.filter(f => f.id !== fieldId);
            this.selectedField = null;
            this.renderFields();
            this.updateFieldCount();
            this.saveToStorage();
            this.showProperties();
            this.showNotification('Field deleted successfully!');
        }
    }

    clearAll() {
        if (this.fields.length === 0) {
            this.showNotification('No fields to clear!');
            return;
        }

        if (confirm('Are you sure you want to clear all fields?')) {
            this.fields = [];
            this.selectedField = null;
            this.renderFields();
            this.updateFieldCount();
            this.saveToStorage();
            this.showProperties();
            this.showNotification('All fields cleared!');
        }
    }

    saveForm() {
        this.saveToStorage();
        this.showNotification('Form saved successfully!');
    }

    saveToStorage() {
        localStorage.setItem('formBuilderFields', JSON.stringify(this.fields));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('formBuilderFields');
        if (saved) {
            this.fields = JSON.parse(saved);
            this.fieldIdCounter = this.fields.length > 0 ? 
                Math.max(...this.fields.map(f => parseInt(f.id.split('_')[1]))) + 1 : 0;
        }
    }

    updateFieldCount() {
        document.getElementById('fieldCount').textContent = this.fields.length;
    }

    showPreview() {
        if (this.fields.length === 0) {
            this.showNotification('Add some fields first!');
            return;
        }

        const previewForm = document.getElementById('previewForm');
        previewForm.innerHTML = this.fields.map(field => {
            let fieldHTML = '';

            switch (field.type) {
                case 'text':
                case 'email':
                case 'number':
                case 'tel':
                case 'date':
                    fieldHTML = `
                        <div class="form-group">
                            <label>${field.label}${field.required ? ' *' : ''}</label>
                            <input type="${field.type}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>
                        </div>
                    `;
                    break;
                case 'textarea':
                    fieldHTML = `
                        <div class="form-group">
                            <label>${field.label}${field.required ? ' *' : ''}</label>
                            <textarea placeholder="${field.placeholder}" ${field.required ? 'required' : ''}></textarea>
                        </div>
                    `;
                    break;
                case 'checkbox':
                    fieldHTML = `
                        <div class="form-group">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="preview_${field.id}" ${field.required ? 'required' : ''}>
                                <label for="preview_${field.id}">${field.label}${field.required ? ' *' : ''}</label>
                            </div>
                        </div>
                    `;
                    break;
                case 'radio':
                    fieldHTML = `
                        <div class="form-group">
                            <label>${field.label}${field.required ? ' *' : ''}</label>
                            ${field.options.map((option, index) => `
                                <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                                    <input type="radio" name="preview_${field.id}" id="preview_${field.id}_${index}" ${field.required ? 'required' : ''}>
                                    <label for="preview_${field.id}_${index}">${option}</label>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    break;
                case 'select':
                    fieldHTML = `
                        <div class="form-group">
                            <label>${field.label}${field.required ? ' *' : ''}</label>
                            <select ${field.required ? 'required' : ''}>
                                <option value="">Select an option</option>
                                ${field.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                            </select>
                        </div>
                    `;
                    break;
                case 'file':
                    fieldHTML = `
                        <div class="form-group">
                            <label>${field.label}${field.required ? ' *' : ''}</label>
                            <input type="file" ${field.required ? 'required' : ''}>
                        </div>
                    `;
                    break;
            }

            return fieldHTML;
        }).join('') + `
            <div class="form-group">
                <button type="submit" class="btn btn-primary" style="width: 100%;">Submit Form</button>
            </div>
        `;

        previewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Form submitted successfully! (This is a preview)');
        });

        document.getElementById('previewModal').classList.add('active');
    }

    closePreview() {
        document.getElementById('previewModal').classList.remove('active');
    }

    exportHTML() {
        const formHTML = document.getElementById('previewForm').innerHTML;
        const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Form</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; padding: 40px 20px; }
        form { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 20px; }
        label { display: block; font-weight: 600; margin-bottom: 8px; color: #1e293b; }
        input, textarea, select { width: 100%; padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 6px; font-size: 14px; font-family: inherit; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        textarea { resize: vertical; min-height: 100px; }
        button { background: #6366f1; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
        button:hover { background: #4f46e5; transform: translateY(-2px); }
    </style>
</head>
<body>
    <form>
        ${formHTML}
    </form>
</body>
</html>`;

        const blob = new Blob([fullHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated-form.html';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Form exported successfully!');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupFileUploadListeners() {
        const fileWrappers = document.querySelectorAll('.file-upload-wrapper');
        
        fileWrappers.forEach(wrapper => {
            const fieldId = wrapper.dataset.fieldId;
            const uploadZone = wrapper.querySelector('.file-upload-zone');
            const fileInput = wrapper.querySelector('input[type="file"]');
            const previewContainer = wrapper.querySelector('.file-preview-container');

            if (!this.uploadedFiles[fieldId]) {
                this.uploadedFiles[fieldId] = [];
            }

            uploadZone.addEventListener('click', () => fileInput.click());

            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.add('drag-active');
            });

            uploadZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.remove('drag-active');
            });

            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.remove('drag-active');
                
                const files = Array.from(e.dataTransfer.files);
                this.handleFileUpload(files, fieldId, previewContainer);
            });

            fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                this.handleFileUpload(files, fieldId, previewContainer);
            });
        });
    }

    handleFileUpload(files, fieldId, previewContainer) {
        files.forEach(file => {
            this.uploadedFiles[fieldId].push(file);
            this.renderFilePreview(file, fieldId, previewContainer);
        });
    }

    renderFilePreview(file, fieldId, previewContainer) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-preview-item';
        
        const fileType = file.type.split('/')[0];
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        let iconOrImage = '';
        
        if (fileType === 'image') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = fileItem.querySelector('.file-preview-icon');
                img.outerHTML = `<img src="${e.target.result}" class="file-preview-image" alt="${file.name}">`;
            };
            reader.readAsDataURL(file);
            iconOrImage = '<div class="file-preview-icon">🖼️</div>';
        } else if (fileType === 'video') {
            iconOrImage = '<div class="file-preview-icon">🎥</div>';
        } else if (fileType === 'audio') {
            iconOrImage = '<div class="file-preview-icon">🎵</div>';
        } else if (fileExt === 'pdf') {
            iconOrImage = '<div class="file-preview-icon">📄</div>';
        } else if (['doc', 'docx'].includes(fileExt)) {
            iconOrImage = '<div class="file-preview-icon">📝</div>';
        } else if (['xls', 'xlsx'].includes(fileExt)) {
            iconOrImage = '<div class="file-preview-icon">📊</div>';
        } else if (['zip', 'rar', '7z'].includes(fileExt)) {
            iconOrImage = '<div class="file-preview-icon">🗜️</div>';
        } else {
            iconOrImage = '<div class="file-preview-icon">📎</div>';
        }
        
        fileItem.innerHTML = `
            ${iconOrImage}
            <div class="file-preview-info">
                <div class="file-preview-name">${file.name}</div>
                <div class="file-preview-size">${this.formatFileSize(file.size)}</div>
            </div>
            <button class="file-remove-btn" data-file-name="${file.name}">Remove</button>
        `;
        
        fileItem.querySelector('.file-remove-btn').addEventListener('click', () => {
            this.removeFile(fieldId, file.name, fileItem);
        });
        
        previewContainer.appendChild(fileItem);
    }

    removeFile(fieldId, fileName, fileItem) {
        this.uploadedFiles[fieldId] = this.uploadedFiles[fieldId].filter(f => f.name !== fileName);
        fileItem.remove();
        this.showNotification('File removed!');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FormBuilder();
});
