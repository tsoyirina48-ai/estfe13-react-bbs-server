
const mysql = require('mysql');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));//json->object

let corsOptions = {
    origin: '*',
};
app.use(cors(corsOptions));


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'dlfk4848',
  database: 'bbs',
});
db.connect();

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
    "SELECT title, content, writer, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM board WHERE id=?;";
  db.query(sqlQuery, [id], (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});


app.post("/write", (req, res) => {
  console.log(req.body);
    const {title, name, content} = req.body;

  const sqlQuery ="insert into board (title, content, writer) values (?,?,?)";
  db.query(sqlQuery, [title, content, name], (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.post("/delete", (req, res) => {
  console.log(req.body);
    const { id } = req.body;

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
    const { title, name, content, id } = req.body;

  const sqlQuery ="UPDATE board SET writer=?, title=?, content=? WHERE id=?";

  db.query(sqlQuery, [title, content, name, id], (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});