
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const multer  = require('multer');
const fs = require('fs');
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));//json->object
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// /uploads  절대경로 upload 폴더에 접근 권한 부여

let corsOptions = {
    origin: '*',
};
app.use(cors(corsOptions));
  
   const storage = multer.diskStorage({
  destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
     
    const orinalExt = file.originalname.split(".")[1];

    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1000);
    cb(null, uniquePrefix + '-' + file.fieldname + "." + orinalExt);
  },
});

const upload = multer({ storage: storage });


const db = mysql.createConnection({
  host: 'localhost',
  user: 'user_bbs',
  password: 'dlfk4848',
  database: 'bbs',
});
db.connect();

function deleteUploadedFile(filePath){
  if(!filePath) return;
  const absolutePath = path.resolve(filePath);
  if(fs.existsSync(absolutePath)){
    fs.unlinkSync(absolutePath);//삭제할 파일의 절대 경로 환
  }
}

app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.get('/list', (req, res) => {
    const sqlQuery = `SELECT id, title, content, writer, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM board;`;
    db.query(sqlQuery, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});
app.get("/view", (req, res) => {
  
  console.log(req.query.id);
  const id = req.query.id;
  // const sqlQuery = `SELECT * FROM board WHERE id=${req.query.id};`;
  const sqlQuery =
    "SELECT title, content, writer, image_path, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM board WHERE id=?;";
  db.query(sqlQuery, [id], (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});


app.post("/write", upload.single('image'), (req, res) => {

 
  console.log(req.body);
  
    const { title, writer, content } = req.body;
    const imagePath = req.file ? req.file.path : null;//req.file.path는 업로드된 파일의 경로

  const sqlQuery ="insert into board ( title, content, writer, image_path ) values (?,?,?,?)";
  db.query(sqlQuery, [title, content, writer, imagePath], (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.post("/delete", (req, res) => {
  console.log(req.body);
    const { id } = req.body;
    //글 번호 삭제할 이미지의 경로 파악
      db.query("SELECT image_path FROM board WHERE id=?", [id], (err, result) => {
    if (err) throw err;
    const existingImagePath = result[0] ? result[0].image_path : null;
    deleteUploadedFile(existingImagePath);
    
  });
  // const sqlQuery = "DELETE FROM board WHERE id=?";
  // db.query(sqlQuery, [id], (err, result) => {
  //   if (err) throw err;
  //   res.send(result);
  // });


  const sqlQuery ="DELETE FROM board WHERE id=?";

  db.query(sqlQuery, [id], (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
app.post("/deleteselect", (req, res) => {
  console.log(req.body);
    const { boardIdList } = req.body;
    //서버에서 여러 이미지 삭제
      db.query(`SELECT image_path FROM board WHERE id in (${boardList})`, (err, result) => {
    if (err) throw err;
    if(result && result.length > 0){
      result.forEach(item=>{
        deleteUploadedFile(item.image.path);
      });
    }
    //const existingImagePath = result[0] ? result[0].image_path : null;
   // deleteUploadedFile(existingImagePath);
    
  });


  const sqlQuery =`delete from board where id in (${boardIdList})`;

  db.query(sqlQuery, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});


app.post("/update", (req, res) => {
  console.log(req.body);
  const { writer, title, content, id, remove_image } = req.body;
  const imagePath = req.file ? req.file.path: null;
  const shouldRemoveImage = remove_image === '1';

  let sqlQuery;
  let params;

  if(shouldRemoveImage && !imagePath){

     db.query("SELECT image_path FROM board WHERE id=?", [id], (err, result) => {
    if (err) throw err;
    const existingImagePath = result[0] ? result[0].image_path : null;
    deleteUploadedFile(existingImagePath);
    
  });

    sqlQuery = "UPDATE board SET writer=?, title=?, content=?, image_path=NULL WHERE id=?";
    params = [writer, title, content, id];

  } else if(imagePath){

    sqlQuery = "UPDATE board SET writer=?, title=?, content=?, image_path=? WHERE id=?";
    params = [writer, title, content,imagePath, id];
  } else{
    sqlQuery = "UPDATE board SET writer=?, title=?, content=?, WHERE id=?";
    params = [writer, title, content, id];
  }

  db.query(sqlQuery, params, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});