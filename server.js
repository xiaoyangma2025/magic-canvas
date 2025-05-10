require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
// 不再需要dashscope SDK

// 添加日志记录函数
function logRequest(endpoint, reqData) {
  console.log(`\n================ 请求数据 (${endpoint}) ================`);
  console.log(JSON.stringify(reqData, null, 2));
  console.log('===============================================\n');
}

function logResponse(endpoint, resData) {
  console.log(`\n================ 响应数据 (${endpoint}) ================`);
  console.log(JSON.stringify(resData, null, 2));
  console.log('===============================================\n');
}

function logError(endpoint, error) {
  console.error(`\n================ 错误 (${endpoint}) ================`);
  if (error.response) {
    // 服务器响应了错误状态码
    console.error('状态码:', error.response.status);
    console.error('响应头:', error.response.headers);
    console.error('响应数据:', error.response.data);
  } else if (error.request) {
    // 请求已发送但没有收到响应
    console.error('请求已发送但没有收到响应:', error.request);
  } else {
    // 发送请求时出错
    console.error('请求错误:', error.message);
  }
  console.error('错误配置:', error.config);
  console.error('===============================================\n');
}

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

// 阿里云灵积API配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
// 修正API基础URL - 使用阿里云灵积官方URL
const DASHSCOPE_API_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

// 文生图API
app.post('/api/text-to-image', async (req, res) => {
  console.log('=== 收到文生图请求 ===');
  console.log('请求体:', JSON.stringify(req.body, null, 2));
  
  try {
    const { prompt, style, ratio } = req.body;
    
    if (!prompt) {
      console.log('错误: 描述文本不能为空');
      return res.status(400).json({ error: '描述文本不能为空' });
    }

    console.log('发送文生图请求:', { prompt, style, ratio });
    
    if (!DASHSCOPE_API_KEY) {
      console.log('错误: API Key未配置');
      return res.status(503).json({
        success: false,
        error: 'API Key未配置，请在.env文件中设置DASHSCOPE_API_KEY'
      });
    }
    
    // 解析尺寸
    let width = 1024;
    let height = 1024;
    if (ratio) {
      if (ratio === '1:1') {
        width = 1024;
        height = 1024;
      } else if (ratio === '4:3') {
        width = 1024;
        height = 768;
      } else if (ratio === '16:9') {
        width = 1024;
        height = 576;
      } else {
        const dimensions = ratio.split('*');
        if (dimensions.length === 2) {
          width = parseInt(dimensions[0], 10);
          height = parseInt(dimensions[1], 10);
        }
      }
    }
    
    // 映射风格到阿里云灵积支持的风格
    let modelStyle = "default";
    if (style === "watercolor") {
      modelStyle = "watercolor";
    } else if (style === "photo") {
      modelStyle = "photographic";
    } else if (style === "cartoon") {
      modelStyle = "cartoon";
    } else if (style === "oil") {
      modelStyle = "oil-painting";
    } else if (style === "art") {
      modelStyle = "artistic";
    }
    
    // 使用阿里云灵积文生图API
    // 使用最简单的wanx模型请求格式
    const apiEndpoint = `${DASHSCOPE_API_BASE_URL}/models/wanx-v1/generation`;
    const requestData = {
      input: {
        prompt: prompt
      },
      parameters: {
        width: width,
        height: height,
        n: 1,
        style: modelStyle
      }
    };
    
    // 记录请求数据
    logRequest('文生图', requestData);
    
    const result = await axios.post(
      apiEndpoint,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`
        }
      }
    );
    
    // 记录响应数据
    logResponse('文生图', result.data);

    // 兼容多种返回格式
    let imageUrl = null;
    
    if (result.data && result.data.output && result.data.output.url) {
      // 标准图像URL
      imageUrl = result.data.output.url;
    } else if (result.data && result.data.output && result.data.output.results && result.data.output.results.length > 0) {
      // 数组结果
      imageUrl = result.data.output.results[0].url;
    } else if (result.data && result.data.images && result.data.images.length > 0) {
      // 另一种可能的格式
      imageUrl = result.data.images[0].url;
    } else if (result.data && result.data.result && result.data.result.url) {
      // 另一种可能的格式
      imageUrl = result.data.result.url;
    }
    
    if (imageUrl) {
      // 下载图片并保存到本地
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      
      // 确保目录存在
      const generatedDir = './generated';
      if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
      }
      
      const imagePath = `${generatedDir}/${Date.now()}.png`;
      fs.writeFileSync(imagePath, Buffer.from(imageResponse.data));
      
      res.json({
        success: true,
        image: '/' + imagePath,
        message: '图片生成成功'
      });
    } else {
      console.log('API返回格式无效');
      return res.status(500).json({
        success: false,
        error: 'API返回格式无效'
      });
    }
    
    /* 为了测试，以下代码作为备用方案，在API调用失败时使用
    // 测试图像生成 - 返回本地示例图像
    console.log('使用测试模式，返回本地示例图像');
    
    // 确保目录存在
    const generatedDir = './generated';
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }
    
    // 获取示例图像
    let exampleImagePath;
    if (style === 'watercolor') {
      exampleImagePath = 'img/水彩艺术.png';
    } else if (style === 'cartoon') {
      exampleImagePath = 'img/动漫插画.png';
    } else if (style === 'oil') {
      exampleImagePath = 'img/经典油画.png';
    } else {
      exampleImagePath = 'img/像素艺术.png';
    }
    
    // 如果示例图像不存在，创建一个简单的图像
    if (!fs.existsSync(exampleImagePath)) {
      console.log('示例图像不存在:', exampleImagePath);
      
      // 返回成功但使用占位符
      return res.json({
        success: true,
        image: '/img/hero-illustration.png',
        message: '图片生成成功(示例)'
      });
    }
    
    // 使用示例图像
    const imagePath = `${generatedDir}/${Date.now()}.jpg`;
    fs.copyFileSync(exampleImagePath, imagePath);
    
    console.log('使用示例图像:', exampleImagePath);
    console.log('复制到:', imagePath);
    
    res.json({
      success: true,
      image: '/' + imagePath,
      message: '图片生成成功(示例)'
    });
    */
    
  } catch (error) {
    console.error('文生图API调用失败:', error);
    logError('文生图', error);
    
    // 尝试使用备用图像
    try {
      // 确保目录存在
      const generatedDir = './generated';
      if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
      }
      
      // 获取示例图像
      let exampleImagePath;
      if (req.body.style === 'watercolor') {
        exampleImagePath = 'img/水彩艺术.png';
      } else if (req.body.style === 'cartoon') {
        exampleImagePath = 'img/动漫插画.png';
      } else if (req.body.style === 'oil') {
        exampleImagePath = 'img/经典油画.png';
      } else {
        exampleImagePath = 'img/像素艺术.png';
      }
      
      // 如果示例图像不存在，使用默认图像
      if (!fs.existsSync(exampleImagePath)) {
        console.log('示例图像不存在:', exampleImagePath);
        
        // 返回成功但使用占位符
        return res.json({
          success: true,
          image: '/img/hero-illustration.png',
          message: '图片生成成功(备用示例)'
        });
      }
      
      // 使用示例图像
      const imagePath = `${generatedDir}/${Date.now()}.jpg`;
      fs.copyFileSync(exampleImagePath, imagePath);
      
      console.log('API调用失败，使用备用示例图像:', exampleImagePath);
      
      return res.json({
        success: true,
        image: '/' + imagePath,
        message: '图片生成成功(备用示例)'
      });
    } catch (backupError) {
      console.error('备用方案也失败:', backupError);
      return res.status(500).json({
        success: false,
        error: '文生图API调用失败: ' + (error.message || '未知错误')
      });
    }
  }
});

// 上传图片API端点
app.post('/api/upload', upload.single('image'), (req, res) => {
  console.log('=== 收到图片上传请求 ===');
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '没有收到图片' });
    }
    
    console.log('上传的文件:', req.file);
    
    res.json({
      success: true,
      image: '/' + req.file.path,
      message: '图片上传成功'
    });
  } catch (error) {
    console.error('图片上传处理失败:', error);
    res.status(500).json({
      success: false,
      error: '图片上传处理失败: ' + error.message
    });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log(`API Key 配置状态: ${DASHSCOPE_API_KEY ? '已配置' : '未配置'}`);
  console.log('提示: 如果需要使用阿里云灵积API，请确保在.env文件中设置DASHSCOPE_API_KEY');
}); 