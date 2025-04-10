require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const xlsx = require('xlsx');


app.use(express.json());
app.use(cors());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')))
// app.post("/api/chat", async (req, res) => {
//   try {
//     const { message } = req.body;
//     if (!message)
//       return res.status(400).json({ error: "Thiếu tin nhắn đầu vào!" });
//     else console.log(message);
//     const response = await axios.post(
//       OPENAI_API_URL,
//       {
//         model: "gpt-4",
//         messages: [{ role: "user", content: message }],
//         temperature: 0.7,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${OPENAI_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     console.log( response.data.choices[0].message.content);
//     res.json({ reply: response.data.choices[0].message.content });
//   } catch (error) {
//     console.error("Lỗi OpenAI API:", error.response?.data || error.message);
//     res.status(500).json({ error: "Lỗi khi gọi OpenAI API" });
//   }
// });
app.get('/Home', async (req, res) => {
    res.render('home');
    console.log("Có 1 user mới đăng nhập");
})


app.get('/gotoVideo', (req, res) => {
    const note = req.query.note;
    const workbook = xlsx.readFile(path.join(__dirname, '/files/metadata.xlsx'));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    let videoUrl = '';
    let documentUrl = '';
    data.forEach(row => {
        if (row.description === note) {
            videoUrl = row.linkvideo;
            documentUrl = row.documents;
        }
    });
    console.log("Video URL:", videoUrl);
    console.log("Document URL:", documentUrl);
    if (videoUrl) {
        res.render('chatBox', { link: videoUrl, document: documentUrl, apikey: OPENAI_API_KEY });
    } else {
        res.status(404).send("Không tìm thấy dữ liệu");
    }
});




app.get('/GetDocument', async (req, res) => {
    const documentUrl = req.query.documentUrl;
    const filePath = path.join(__dirname, 'files', documentUrl);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Lỗi gửi file:', err);
            res.status(500).send('Lỗi khi gửi file');
        }
    });
});
app.listen(PORT, () =>
    console.log(`🚀 Server đang chạy tại ${PORT}`)
);
