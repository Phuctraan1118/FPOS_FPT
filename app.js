const express = require("express");
const app = express();
const port = process.env.PORT;
var bodyParser = require("body-parser");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
var path = require("path");
var cors = require("cors");
const engines = require("consolidate");
const paypal = require("paypal-rest-sdk");

// To access public folder
paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "AU4u2BCKN52ah7wljq-He9fsv27yB-Ia7y0SRBjXyEPLwH2cAgw7Wstm-q0Ewh4bnHn7f8EGfaZqiGvJ",
  client_secret:
    "ENgtHS84I0eKC3fzxk-vmFa4bhZ2mX81CCiye6cUVsjIAiECaxqxAbyhbSk1MFMCC0bTyrlKKhgm0ClP",
});

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// Set up Global configuration access
dotenv.config();

// MULTER
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    let uploadFile = file.originalname.split(".");
    let name = `${uploadFile[0]}-${Date.now()}.${
      uploadFile[uploadFile.length - 1]
    }`;
    cb(null, name);
  },
});
const upload = multer({ storage: storage });

const {
  register,
  login,
  updateUser,
  deleteUser,
  userById,
  resetPassword,
} = require("./controllers/auth/auth");
const {
  addProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
} = require("./controllers/products/products");
const {
  checkout,
  addToCart,
  cart,
  removeFromCart,
} = require("./controllers/user/cart");
const { isAdmin, checkAuth } = require("./controllers/middlewares/auth");
const { dashboardData, getAllUsers } = require("./controllers/admin/dashboard");
const {
  getAllOrders,
  changeStatusOfOrder,
} = require("./controllers/admin/orders");
const { orders } = require("./controllers/user/orders");
const {
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("./controllers/categories/category");
const {
  addToWishlist,
  wishlist,
  removeFromWishlist,
} = require("./controllers/user/wishlist");
const mongoose = require("./config/database")();

app.get("/", (req, res) => {
  res.send("Hello Worldddd!");
});

app.get("/paypal", (req, res) => {
  var create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "https://fpos-fpt.vercel.app/success",
      cancel_url: "https://fpos-fpt.vercel.app/cancel",
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: "item",
              sku: "item",
              price: "5.00",
              currency: "USD",
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: "USD",
          total: "5.00",
        },
        description: "This is the payment description.",
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error;
    } else {
      console.log("Create Payment Response");
      console.log(payment);
      res.redirect(payment.links[1].href);
    }
  });
});

app.get("/success", (req, res) => {
  // res.send("Success");
  var PayerID = req.query.PayerID;
  var paymentId = req.query.paymentId;
  var execute_payment_json = {
    payer_id: PayerID,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: "5.00",
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        console.log(error.response);
        const sendDataToReactNativeApp = async () => {
          window.ReactNativeWebView.postMessage("Data from WebView / Website");
        };
        throw error;
      } else {
        console.log("Get Payment Response");
        console.log(JSON.stringify(payment));
        console.log(payment.payer.status);
        app.get("/products", getAllProducts);
      }
    }
  );
});

app.get("/cancel", (req, res) => {
  res.render("cancel");
});

// AUTH
app.post("/register", register);
app.post("/login", login);

// User Routes
app.post("/update-user", updateUser);
app.get("/user", userById);
app.get("/delete-user", deleteUser);
app.post("/reset-password", resetPassword);

// Products
app.post("/product", [isAdmin], addProduct);
app.get("/products", getAllProducts);
app.post("/update-product", [isAdmin], updateProduct);
app.get("/delete-product", [isAdmin], deleteProduct);

// CATEGORIES
app.post("/category", [isAdmin], addCategory);
app.get("/categories", getCategories);
app.post("/update-category", [isAdmin], updateCategory);
app.get("/delete-category", [isAdmin], deleteCategory);

// ORDERS
app.get("/orders", [checkAuth], orders);

// CHECKOUT
app.post("/checkout", [checkAuth], checkout);

// WISHLIST
app.post("/add-to-wishlist", [checkAuth], addToWishlist);
app.get("/wishlist", [checkAuth], wishlist);
app.get("/remove-from-wishlist", [checkAuth], removeFromWishlist);

// ADMIN
app.get("/dashboard", [isAdmin], dashboardData);
app.get("/admin/orders", [isAdmin], getAllOrders);
app.get("/admin/order-status", [isAdmin], changeStatusOfOrder);
app.get("/admin/users", [isAdmin], getAllUsers);

// HELPER
app.post(
  "/photos/upload",
  upload.array("photos", 12),
  function (req, res, next) {
    // req.files is array of `photos` files

    try {
      let files = req.files;
      if (!files.length) {
        return res.status(400).json({
          err: "Please upload an image",
          msg: "Please upload an image",
        });
      }
      let file = req.files[0];
      if (
        file.mimetype == "image/png" ||
        file.mimetype == "image/jpg" ||
        file.mimetype == "image/jpeg"
      ) {
        return res.json({ image: file.filename });
      }
    } catch (error) {
      return res.send(error.message);
    }
  }
);

app.listen(process.env.PORT || 8081, () => {
  console.log(`Example app listening on port ${process.env.PORT}!`);
});
