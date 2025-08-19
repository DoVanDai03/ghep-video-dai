// 2. File: main.js
// File này chịu trách nhiệm tạo cửa sổ ứng dụng và xử lý logic nền.

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Thiết lập đường dẫn cho ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  // Xử lý sự kiện chọn file từ giao diện
  ipcMain.handle('dialog:openFile', async (event, options) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(options);
    if (canceled) {
      return null;
    } else {
      return filePaths[0];
    }
  });

  // Xử lý sự kiện chọn nơi lưu file
  ipcMain.handle('dialog:saveFile', async (event, options) => {
    const { canceled, filePath } = await dialog.showSaveDialog(options);
    if (canceled) {
        return null;
    } else {
        return filePath;
    }
  });

  // Xử lý sự kiện bắt đầu ghép video
  ipcMain.on('start-processing', (event, options) => {
    const { inputVideo, inputAudio, duration, output, fastMode } = options;
    const win = BrowserWindow.getFocusedWindow();

    const videoCodec = fastMode ? 'copy' : 'libx264';
    const audioCodec = 'aac';

    const command = ffmpeg();

    // Thêm video đầu vào với tùy chọn lặp lại
    command.input(inputVideo)
      .inputOptions(['-stream_loop -1', '-fflags +genpts']);

    const outputOpts = [
      '-map 0:v:0', // Lấy luồng video từ file đầu tiên (0)
      '-map 1:a:0'  // Lấy luồng audio từ file thứ hai (1)
    ];

    // *** SỬA LỖI TẠI ĐÂY ***
    // Logic mới: chỉ lặp âm thanh khi người dùng nhập độ dài cụ thể
    if (duration) {
      // Trường hợp 1: Có độ dài -> lặp cả âm thanh và cắt theo độ dài
      command.input(inputAudio)
        .inputOptions(['-stream_loop -1']); // Lặp lại âm thanh
      outputOpts.push(`-t ${duration}`); // Cắt theo độ dài
    } else {
      // Trường hợp 2: Không có độ dài -> không lặp âm thanh, lấy độ dài nhạc làm chuẩn
      command.input(inputAudio);
      outputOpts.push('-shortest'); // Dừng khi luồng ngắn nhất (âm thanh) kết thúc
    }

    // Thêm các tùy chọn và chạy lệnh
    command
      .videoCodec(videoCodec)
      .audioCodec(audioCodec)
      .outputOptions(outputOpts)
      .output(output);

    command
      .on('start', (cmd) => {
        const mode = fastMode ? 'Chế độ Nhanh' : 'Chế độ Chất lượng';
        win.webContents.send('update-status', `Bắt đầu xử lý (${mode})...`);
      })
      .on('progress', (p) => {
        const progressText = fastMode ? 'Đang sao chép video, nén âm thanh...' : `Đã xử lý: ${p.timemark.split('.')[0]}`;
        win.webContents.send('update-progress', progressText);
      })
      .on('end', () => {
        win.webContents.send('update-status', `✅ Hoàn thành! File đã được lưu.`);
        win.webContents.send('processing-done');
      })
      .on('error', (err) => {
        win.webContents.send('update-status', `❌ Lỗi: ${err.message}`);
        win.webContents.send('processing-done');
      })
      .run();
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
