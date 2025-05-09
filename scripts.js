// 等待DOM完全加载
document.addEventListener('DOMContentLoaded', function() {
    // 常量和变量
    const header = document.querySelector('header');
    const createTabs = document.querySelectorAll('.create-tab');
    const faqItems = document.querySelectorAll('.faq-item');
    const styleOptions = document.querySelectorAll('.style-option');
    const ratioOptions = document.querySelectorAll('.ratio-option');
    const clearBtn = document.querySelector('.action-buttons .btn-secondary');
    const generateBtn = document.querySelector('.action-buttons .btn-primary');
    const promptTextarea = document.querySelector('.input-area textarea');
    const previewArea = document.querySelector('.preview-area');
    const panels = document.querySelectorAll('.create-panel');

    // 初始化预览区域
    if (previewArea) {
        const placeholder = document.querySelector('.preview-placeholder');
        
        // 如果预览区域中没有下载按钮，则添加一个
        if (!document.querySelector('.download-btn')) {
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn initial-hidden';
            downloadBtn.innerHTML = '<span class="material-symbols-outlined">download</span> 下载图片';
            
            // 添加下载按钮到预览区域
            if (placeholder) {
                placeholder.parentNode.appendChild(downloadBtn);
            } else {
                previewArea.appendChild(downloadBtn);
            }
            
            // 初始状态下下载按钮是隐藏的
            downloadBtn.style.display = 'none';
        }
    }

    // 滚动时改变头部样式
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 创作选项卡切换
    createTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有active类
            createTabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            // 添加active类到当前选中的选项卡和面板
            tab.classList.add('active');
            const targetPanel = document.getElementById(`${tab.dataset.tab}-panel`);
            targetPanel.classList.add('active');
        });
    });

    // FAQ问答切换
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            // 检查当前项目是否是激活状态
            const isActive = item.classList.contains('active');
            
            // 关闭所有FAQ项目
            faqItems.forEach(i => {
                i.classList.remove('active');
                const icon = i.querySelector('.faq-icon');
                icon.textContent = '+';
            });
            
            // 如果当前项目不是激活状态，则激活它
            if (!isActive) {
                item.classList.add('active');
                const icon = item.querySelector('.faq-icon');
                icon.textContent = '−';
            }
        });
    });

    // 样式选项选择
    styleOptions.forEach(option => {
        option.addEventListener('click', () => {
            if (!option.classList.contains('more')) {
                styleOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
            }
        });
    });

    // 比例选项选择
    ratioOptions.forEach(option => {
        option.addEventListener('click', () => {
            ratioOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
        });
    });

    // 风格转换卡片切换
    const styleCards = document.querySelectorAll('.style-card');
    styleCards.forEach(card => {
        card.addEventListener('click', () => {
            styleCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });

    // 清除按钮功能
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            promptTextarea.value = '';
            // 可以添加其他重置逻辑，如重置样式选择等
        });
    }

    // 生成按钮功能
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            if (promptTextarea.value.trim() === '') {
                alert('请输入描述以生成图像');
                return;
            }
            
            // 显示加载中状态
            generateBtn.textContent = '生成中...';
            generateBtn.disabled = true;
            
            // 模拟生成过程
            setTimeout(function() {
                // 恢复按钮状态
                generateBtn.textContent = '生成 (免费)';
                generateBtn.disabled = false;
                
                // 模拟显示结果，实际应用中会是API调用
                const previewArea = document.querySelector('.preview-area');
                const placeholder = document.querySelector('.preview-placeholder');
                
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
                
                // 清除预览区域中的任何现有内容，但保留下载按钮
                const downloadBtn = document.querySelector('.download-btn');
                while (previewArea.firstChild) {
                    if (previewArea.firstChild === downloadBtn) {
                        break;
                    }
                    previewArea.removeChild(previewArea.firstChild);
                }
                
                // 创建结果容器
                const resultContainer = document.createElement('div');
                resultContainer.className = 'result-container';
                
                // 创建模拟的结果图像
                const resultImage = document.createElement('img');
                resultImage.src = 'img/generated-result.jpg'; // 在实际应用中，这会是API返回的图像URL
                resultImage.alt = '生成的艺术作品';
                resultImage.className = 'generated-image';
                
                // 将图像添加到结果容器
                resultContainer.appendChild(resultImage);
                
                // 将结果容器添加到预览区域
                previewArea.insertBefore(resultContainer, downloadBtn);
                
                // 显示下载按钮
                if (downloadBtn) {
                    downloadBtn.style.display = 'flex';
                    
                    // 更新下载按钮的事件监听器，使其引用新生成的图像
                    downloadBtn.onclick = function() {
                        // 创建一个链接元素
                        const downloadLink = document.createElement('a');
                        downloadLink.href = resultImage.src;
                        downloadLink.download = '艺术作品_' + new Date().getTime() + '.jpg';
                        
                        // 模拟点击链接以触发下载
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                    };
                }
                
                console.log('图像生成完成');
            }, 2000); // 模拟2秒的生成时间
        });
    }

    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 模拟页面加载完成后的动画
    setTimeout(function() {
        document.body.classList.add('loaded');
    }, 500);

    // 图片上传功能
    const setupImageUpload = (uploadZoneId, previewId, inputId) => {
        const uploadZone = document.getElementById(uploadZoneId);
        const preview = document.getElementById(previewId);
        const input = document.getElementById(inputId);
        const previewImg = preview.querySelector('img');
        const changeBtn = preview.querySelector('.btn-change');

        const handleFile = (file) => {
            if (file) {
                // 验证文件类型
                if (!file.type.startsWith('image/')) {
                    alert('请上传图片文件');
                    return;
                }

                // 验证文件大小（10MB）
                if (file.size > 10 * 1024 * 1024) {
                    alert('图片大小不能超过10MB');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    uploadZone.style.display = 'none';
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        };

        // 点击上传区域触发文件选择
        uploadZone.addEventListener('click', () => {
            input.click();
        });

        // 处理文件选择
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            handleFile(file);
        });

        // 处理拖放
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--primary-color)';
            uploadZone.style.backgroundColor = 'rgba(126, 34, 206, 0.05)';
        });

        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--border-dark)';
            uploadZone.style.backgroundColor = 'transparent';
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--border-dark)';
            uploadZone.style.backgroundColor = 'transparent';
            const file = e.dataTransfer.files[0];
            handleFile(file);
        });

        // 更换图片按钮
        changeBtn.addEventListener('click', () => {
            input.value = ''; // 清除之前的选择
            input.click();
        });
    };

    // 设置图生图上传
    setupImageUpload('uploadZone', 'uploadPreview', 'imageUpload');
    // 设置风格转换上传
    setupImageUpload('styleUploadZone', 'styleUploadPreview', 'styleImageUpload');
}); 