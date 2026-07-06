
const mysql = require('mysql');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
const multer  = require('multer');
const fs = require('fs');
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));//json->object
app.use("/uploads", express.static("uploads"));

let corsOptions = {
    origin: '*',
};
app.use(cors(corsOptions));
  
   const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
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
  user: 'root',
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
    console.log(result);
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