var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    let products = [
        {
            name: "VIVO Y 19",
            catagory: "mobile",
            description: "amazon choice by vivo",
            image: "data:image/jpeg;base64,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"
        },
        {
            name: "IPHONE 11 ",
            catagory: "mobile",
            description: "amazon choice by APPLE",
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQuXdwIkMW0UfKcbVSfgYWnXdlvE7jz2ZPE__4EYt3BYjR2nUK0ftjKX1lO_nlxMQisCDZqKRP6&usqp=CAc"
        },
        {
            name: "REDMI 9 PRIME ",
            catagory: "mobile",
            description: "amazon choice by XAVOME",
            image: "data:image/jpeg;base64,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"

        },
        {
            name: "REALME NAZRO 10 ",
            catagory: "mobile",
            description: "amazon choice by REALME",
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQ3HGIYPQa2BrDLP5zf2xHHEkptaRwPkDF8uQ&usqp=CAU"
        }
    ]
    res.render('index', { products,admin:true });
});

module.exports = router;
module.exports = router;