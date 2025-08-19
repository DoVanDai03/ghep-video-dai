// 5. File: renderer.js
// File này chứa code JavaScript để xử lý các tương tác trên giao diện (index.html).

// Lấy các element từ HTML
const videoPathInput = document.getElementById('video-path');
const audioPathInput = document.getElementById('audio-path');
const outputPathInput = document.getElementById('output-path');
const durationInput = document.getElementById('duration');
const fastModeCheckbox = document.getElementById('fast-mode'); // Thêm checkbox

const browseVideoBtn = document.getElementById('browse-video');
const browseAudioBtn = document.getElementById('browse-audio');
const browseOutputBtn = document.getElementById('browse-output');
const startBtn = document.getElementById('start-btn');

const statusContainer = document.getElementById('status-container');
const statusText = document.getElementById('status-text');
const progressText = document.getElementById('progress-text');

// Xử lý sự kiện click nút "Chọn File" cho video
browseVideoBtn.addEventListener('click', async () => {
    const filePath = await window.electronAPI.openFile({
        title: 'Chọn file video',
        filters: [{ name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv'] }]
    });
    if (filePath) {
        videoPathInput.value = filePath;
    }
});

// Xử lý sự kiện click nút "Chọn File" cho audio
browseAudioBtn.addEventListener('click', async () => {
    const filePath = await window.electronAPI.openFile({
        title: 'Chọn file audio',
        filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'm4a'] }]
    });
    if (filePath) {
        audioPathInput.value = filePath;
    }
});

// Xử lý sự kiện click nút "Chọn Vị Trí" để lưu file
browseOutputBtn.addEventListener('click', async () => {
    const filePath = await window.electronAPI.saveFile({
        title: 'Lưu file video',
        defaultPath: 'video-ket-qua.mp4',
        filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
    });
    if (filePath) {
        outputPathInput.value = filePath;
    }
});

// Xử lý sự kiện click nút "Bắt Đầu"
startBtn.addEventListener('click', () => {
    const options = {
        inputVideo: videoPathInput.value,
        inputAudio: audioPathInput.value,
        duration: durationInput.value,
        output: outputPathInput.value,
        fastMode: fastModeCheckbox.checked, // Lấy giá trị từ checkbox
    };

    // Kiểm tra xem người dùng đã điền đủ thông tin chưa
    if (!options.inputVideo || !options.inputAudio || !options.output) {
        statusContainer.classList.remove('hidden');
        statusText.textContent = 'Vui lòng điền đầy đủ các trường bắt buộc!';
        progressText.textContent = '';
        return;
    }

    // Vô hiệu hóa nút và hiển thị trạng thái
    startBtn.disabled = true;
    startBtn.textContent = 'Đang xử lý...';
    statusContainer.classList.remove('hidden');
    progressText.textContent = '';
    
    // Gửi yêu cầu xử lý
    window.electronAPI.startProcessing(options);
});

// Lắng nghe cập nhật trạng thái
window.electronAPI.onUpdateStatus((status) => {
    statusText.textContent = status;
});

// Lắng nghe cập nhật tiến trình
window.electronAPI.onUpdateProgress((progress) => {
    progressText.textContent = progress;
});

// Lắng nghe khi xử lý xong
window.electronAPI.onProcessingDone(() => {
    startBtn.disabled = false;
    startBtn.textContent = 'Bắt Đầu Ghép Video';
});
