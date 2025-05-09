require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { Generation } = require('@alicloud/dashscope');

// 初始化Express应用
const app = express();
const port = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// 图片上传配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 限制10MB
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件'));
    }
  }
});

// 阿里云百炼API实例
const generation = new Generation({
  apiKey: process.env.DASHSCOPE_API_KEY,
});

// 文生图API
app.post('/api/text-to-image', async (req, res) => {
  try {
    const { prompt, style, ratio } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: '描述文本不能为空' });
    }

    console.log('发送文生图请求:', { prompt, style, ratio });
    
    // 调用阿里云百炼文生图API
    const result = await generation.imageGeneration({
      model: 'wanx-v1',
      prompt: prompt,
      n: 1,
      size: ratio || '1024*1024',
      style: style || 'photo',
    });

    if (result.output && result.output.results && result.output.results.length > 0) {
      // 获取生成的图片URL
      const imageUrl = result.output.results[0].url;
      
      // 下载图片并保存到本地
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imagePath = `./generated/${Date.now()}.png`;
      
      // 确保目录存在
      if (!fs.existsSync('./generated')) {
        fs.mkdirSync('./generated', { recursive: true });
      }
      
      fs.writeFileSync(imagePath, imageResponse.data);
      
      res.json({
        success: true,
        image: '/' + imagePath,
        message: '图片生成成功'
      });
    } else {
      throw new Error('API返回结果格式不正确');
    }
  } catch (error) {
    console.error('文生图API错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '图片生成失败'
    });
  }
});

// 图生图API
app.post('/api/image-to-image', upload.single('image'), async (req, res) => {
  try {
    const { style, strength } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    console.log('发送图生图请求:', { style, imagePath });
    
    // 调用阿里云百炼图生图API
    const result = await generation.imageToImage({
      model: 'wanx-v1',
      input_image: base64Image,
      style: style || 'photo',
      strength: strength || 0.5
    });

    if (result.output && result.output.results && result.output.results.length > 0) {
      // 获取生成的图片URL
      const imageUrl = result.output.results[0].url;
      
      // 下载图片并保存到本地
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const outputPath = `./generated/${Date.now()}.png`;
      
      // 确保目录存在
      if (!fs.existsSync('./generated')) {
        fs.mkdirSync('./generated', { recursive: true });
      }
      
      fs.writeFileSync(outputPath, imageResponse.data);
      
      res.json({
        success: true,
        image: '/' + outputPath,
        message: '图片生成成功'
      });
    } else {
      throw new Error('API返回结果格式不正确');
    }
  } catch (error) {
    console.error('图生图API错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '图片处理失败'
    });
  }
});

// 风格转换API
app.post('/api/style-transfer', upload.single('image'), async (req, res) => {
  try {
    const { style } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    console.log('发送风格转换请求:', { style, imagePath });
    
    // 调用阿里云百炼风格转换API
    const result = await generation.styleTransfer({
      model: 'wanx-style-transfer-v1',
      input_image: base64Image,
      style_name: style || 'watercolor'
    });

    if (result.output && result.output.results && result.output.results.length > 0) {
      // 获取生成的图片URL
      const imageUrl = result.output.results[0].url;
      
      // 下载图片并保存到本地
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const outputPath = `./generated/${Date.now()}.png`;
      
      // 确保目录存在
      if (!fs.existsSync('./generated')) {
        fs.mkdirSync('./generated', { recursive: true });
      }
      
      fs.writeFileSync(outputPath, imageResponse.data);
      
      res.json({
        success: true,
        image: '/' + outputPath,
        message: '风格转换成功'
      });
    } else {
      throw new Error('API返回结果格式不正确');
    }
  } catch (error) {
    console.error('风格转换API错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '风格转换失败'
    });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器已启动，端口: ${port}`);
  console.log(`API Key状态: ${process.env.DASHSCOPE_API_KEY ? '已配置' : '未配置'}`);
}); 