class ImageConverter {
    constructor() {
        this.files = [];
        this.outputFormat = 'jpeg';
        this.quality = 90;
        this.resize = false;
        this.width = null;
        this.height = null;
        this.keepAspectRatio = true;
        this.smartCrop = false;
        this.preserveMetadata = false;
        this.progressive = false;
        this.originalRatios = new Map();
        this.convertedFiles = [];
        this.viewMode = 'grid';
        
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.optionsSection = document.getElementById('optionsSection');
        this.previewSection = document.getElementById('previewSection');
        this.actionSection = document.getElementById('actionSection');
        this.progressSection = document.getElementById('progressSection');
        this.previewGrid = document.getElementById('previewGrid');
        this.fileCount = document.getElementById('fileCount');
        this.convertBtn = document.getElementById('convertBtn');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.downloadZipBtn = document.getElementById('downloadZipBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.qualitySlider = document.getElementById('qualitySlider');
        this.qualityValue = document.getElementById('qualityValue');
        this.resizeToggle = document.getElementById('resizeToggle');
        this.resizeInputs = document.getElementById('resizeInputs');
        this.widthInput = document.getElementById('widthInput');
        this.heightInput = document.getElementById('heightInput');
        this.aspectRatioBtn = document.getElementById('aspectRatioBtn');
        this.resizeModeBtn = document.getElementById('resizeModeBtn');
        this.metadataToggle = document.getElementById('metadataToggle');
        this.progressiveToggle = document.getElementById('progressiveToggle');
        this.formatBtns = document.querySelectorAll('.format-btn');
        this.presetBtns = document.querySelectorAll('.preset-btn');
        this.viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.progressPercent = document.getElementById('progressPercent');
        
        // Modal elements
        this.imageModal = document.getElementById('imageModal');
        this.modalClose = document.getElementById('modalClose');
        this.modalImage = document.getElementById('modalImage');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalDetails = document.getElementById('modalDetails');
    }

    bindEvents() {
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
        
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });

        this.formatBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.formatBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.outputFormat = btn.dataset.format;
                this.updateQualityControl();
            });
        });

        this.qualitySlider.addEventListener('input', (e) => {
            this.quality = e.target.value;
            this.qualityValue.textContent = `${this.quality}%`;
        });

        this.resizeToggle.addEventListener('change', (e) => {
            this.resize = e.target.checked;
            this.resizeInputs.style.display = this.resize ? 'block' : 'none';
        });

        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.widthInput.value = btn.dataset.width;
                this.heightInput.value = btn.dataset.height;
                if (this.keepAspectRatio) {
                    this.updateAspectRatio();
                }
            });
        });

        this.aspectRatioBtn.addEventListener('click', () => {
            this.keepAspectRatio = !this.keepAspectRatio;
            this.aspectRatioBtn.classList.toggle('active');
            if (this.keepAspectRatio) {
                this.smartCrop = false;
                this.resizeModeBtn.classList.remove('active');
                this.updateAspectRatio();
            }
        });

        this.resizeModeBtn.addEventListener('click', () => {
            this.smartCrop = !this.smartCrop;
            this.resizeModeBtn.classList.toggle('active');
            if (this.smartCrop) {
                this.keepAspectRatio = false;
                this.aspectRatioBtn.classList.remove('active');
            }
        });

        this.widthInput.addEventListener('input', () => {
            if (this.keepAspectRatio && this.width && this.originalRatios.size > 0) {
                this.updateHeightFromWidth();
            }
        });

        this.heightInput.addEventListener('input', () => {
            if (this.keepAspectRatio && this.height && this.originalRatios.size > 0) {
                this.updateWidthFromHeight();
            }
        });

        this.metadataToggle.addEventListener('change', (e) => {
            this.preserveMetadata = e.target.checked;
        });

        this.progressiveToggle.addEventListener('change', (e) => {
            this.progressive = e.target.checked;
        });

        this.viewToggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.viewToggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.viewMode = btn.dataset.view;
                this.updateViewMode();
            });
        });

        this.clearAllBtn.addEventListener('click', () => this.clearAll());

        this.convertBtn.addEventListener('click', () => this.convertImages());
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
        this.downloadZipBtn.addEventListener('click', () => this.downloadZip());

        // Modal events
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.imageModal.addEventListener('click', (e) => {
            if (e.target === this.imageModal) {
                this.closeModal();
            }
        });
    }

    handleFileSelect(files) {
        const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (newFiles.length === 0) {
            this.showMessage('请选择有效的图片文件', 'error');
            return;
        }

        this.files = [...this.files, ...newFiles];
        this.optionsSection.style.display = 'block';
        this.actionSection.style.display = 'flex';
        this.updateFileCount();
        this.displayPreviews();
    }

    updateFileCount() {
        this.fileCount.textContent = this.files.length;
    }

    displayPreviews() {
        this.previewGrid.innerHTML = '';
        this.originalRatios.clear();

        this.files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.originalRatios.set(index, img.width / img.height);
                    this.createPreviewItem(e.target.result, file, index);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    createPreviewItem(src, file, index) {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
            <img src="${src}" alt="${file.name}" data-index="${index}">
            <div class="preview-actions">
                <button class="preview-action-btn view-btn" data-index="${index}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                <button class="preview-action-btn remove-btn" data-index="${index}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="preview-info">
                <div class="preview-name">${file.name}</div>
                <div class="preview-size">${this.formatFileSize(file.size)}</div>
                <div class="preview-dimensions">加载中...</div>
            </div>
        `;
        
        this.previewGrid.appendChild(item);
        this.previewSection.style.display = 'block';

        // Get image dimensions
        const img = new Image();
        img.onload = () => {
            const dimensionsDiv = item.querySelector('.preview-dimensions');
            dimensionsDiv.textContent = `${img.width} × ${img.height}`;
        };
        img.src = src;

        // Bind events
        const viewBtn = item.querySelector('.view-btn');
        const removeBtn = item.querySelector('.remove-btn');
        const imgElement = item.querySelector('img');

        viewBtn.addEventListener('click', () => this.viewImage(index));
        removeBtn.addEventListener('click', () => this.removeFile(index));
        imgElement.addEventListener('click', () => this.viewImage(index));
    }

    viewImage(index) {
        const file = this.files[index];
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.modalImage.src = e.target.result;
                this.modalTitle.textContent = file.name;
                this.modalDetails.innerHTML = `
                    尺寸: ${img.width} × ${img.height}px<br>
                    大小: ${this.formatFileSize(file.size)}<br>
                    格式: ${file.type}
                `;
                this.imageModal.style.display = 'flex';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    closeModal() {
        this.imageModal.style.display = 'none';
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updateFileCount();
        this.displayPreviews();
        
        if (this.files.length === 0) {
            this.clearAll();
        }
    }

    clearAll() {
        this.files = [];
        this.convertedFiles = [];
        this.originalRatios.clear();
        this.previewGrid.innerHTML = '';
        this.previewSection.style.display = 'none';
        this.optionsSection.style.display = 'none';
        this.actionSection.style.display = 'none';
        this.progressSection.style.display = 'none';
        this.downloadAllBtn.style.display = 'none';
        this.downloadZipBtn.style.display = 'none';
        this.fileInput.value = '';
    }

    updateViewMode() {
        if (this.viewMode === 'list') {
            this.previewGrid.classList.add('list-view');
        } else {
            this.previewGrid.classList.remove('list-view');
        }
    }

    updateQualityControl() {
        const qualityControl = document.getElementById('qualityControl');
        if (['png', 'bmp', 'ico', 'tiff'].includes(this.outputFormat)) {
            qualityControl.style.display = 'none';
        } else {
            qualityControl.style.display = 'block';
        }
    }

    updateAspectRatio() {
        if (this.keepAspectRatio && this.width && this.originalRatios.size > 0) {
            this.updateHeightFromWidth();
        }
    }

    updateHeightFromWidth() {
        const width = parseInt(this.widthInput.value);
        if (width && this.originalRatios.size > 0) {
            const avgRatio = Array.from(this.originalRatios.values()).reduce((a, b) => a + b, 0) / this.originalRatios.size;
            this.heightInput.value = Math.round(width / avgRatio);
        }
    }

    updateWidthFromHeight() {
        const height = parseInt(this.heightInput.value);
        if (height && this.originalRatios.size > 0) {
            const avgRatio = Array.from(this.originalRatios.values()).reduce((a, b) => a + b, 0) / this.originalRatios.size;
            this.widthInput.value = Math.round(height * avgRatio);
        }
    }

    async convertImages() {
        if (this.files.length === 0) return;

        this.convertBtn.disabled = true;
        this.convertBtn.innerHTML = '<span>转换中...</span>';
        this.progressSection.style.display = 'block';
        this.convertedFiles = [];
        
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            this.updateProgress(i + 1, this.files.length, `正在转换 ${file.name}...`);
            
            try {
                const convertedFile = await this.convertImage(file, i);
                if (convertedFile) {
                    this.convertedFiles.push(convertedFile);
                }
            } catch (error) {
                console.error('转换失败:', error);
                this.showMessage(`转换 ${file.name} 失败`, 'error');
            }
        }

        this.progressSection.style.display = 'none';
        this.convertBtn.disabled = false;
        this.convertBtn.innerHTML = '<span>开始转换</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>';

        if (this.convertedFiles.length > 0) {
            this.downloadAllBtn.style.display = 'flex';
            this.downloadZipBtn.style.display = 'flex';
            this.showMessage(`成功转换 ${this.convertedFiles.length} 张图片`, 'success');
        }
    }

    convertImage(file, index) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let width = img.width;
                    let height = img.height;
                    
                    if (this.resize) {
                        const targetWidth = parseInt(this.widthInput.value) || width;
                        const targetHeight = parseInt(this.heightInput.value) || height;
                        
                        if (this.smartCrop) {
                            // Smart crop implementation
                            const targetRatio = targetWidth / targetHeight;
                            const sourceRatio = width / height;
                            
                            if (sourceRatio > targetRatio) {
                                // Crop width
                                const newWidth = height * targetRatio;
                                const x = (width - newWidth) / 2;
                                canvas.width = targetWidth;
                                canvas.height = targetHeight;
                                ctx.drawImage(img, x, 0, newWidth, height, 0, 0, targetWidth, targetHeight);
                            } else {
                                // Crop height
                                const newHeight = width / targetRatio;
                                const y = (height - newHeight) / 2;
                                canvas.width = targetWidth;
                                canvas.height = targetHeight;
                                ctx.drawImage(img, 0, y, width, newHeight, 0, 0, targetWidth, targetHeight);
                            }
                        } else if (this.keepAspectRatio) {
                            const ratio = Math.min(targetWidth / width, targetHeight / height);
                            width = width * ratio;
                            height = height * ratio;
                            canvas.width = width;
                            canvas.height = height;
                            ctx.drawImage(img, 0, 0, width, height);
                        } else {
                            width = targetWidth;
                            height = targetHeight;
                            canvas.width = width;
                            canvas.height = height;
                            ctx.drawImage(img, 0, 0, width, height);
                        }
                    } else {
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                    }
                    
                    const mimeType = this.getMimeType();
                    canvas.toBlob((blob) => {
                        const fileName = this.getNewFileName(file.name);
                        const convertedFile = new File([blob], fileName, { type: mimeType });
                        resolve(convertedFile);
                    }, mimeType, this.getQuality());
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    getMimeType() {
        const mimeTypes = {
            'jpeg': 'image/jpeg',
            'jpg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'tiff': 'image/tiff',
            'ico': 'image/x-icon',
            'avif': 'image/avif'
        };
        return mimeTypes[this.outputFormat] || 'image/jpeg';
    }

    getQuality() {
        if (['png', 'bmp', 'ico', 'tiff'].includes(this.outputFormat)) {
            return undefined;
        }
        return this.quality / 100;
    }

    getNewFileName(originalName) {
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        return `${nameWithoutExt}.${this.outputFormat}`;
    }

    updateProgress(current, total, text) {
        const percent = Math.round((current / total) * 100);
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = text;
        this.progressPercent.textContent = `${percent}%`;
    }

    downloadAll() {
        if (!this.convertedFiles || this.convertedFiles.length === 0) return;
        
        this.convertedFiles.forEach(file => {
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    async downloadZip() {
        if (!this.convertedFiles || this.convertedFiles.length === 0) return;

        // Create zip file using JSZip (simplified version)
        const zip = new JSZip();
        
        this.convertedFiles.forEach(file => {
            zip.file(file.name, file);
        });

        try {
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `converted_images_${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('创建压缩包失败:', error);
            this.showMessage('创建压缩包失败，请逐个下载', 'error');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'error' ? 'var(--error)' : 'var(--success)'};
            color: white;
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => document.body.removeChild(messageDiv), 300);
        }, 3000);
    }
}

// Add JSZip library for zip functionality
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
document.head.appendChild(script);

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

new ImageConverter();
