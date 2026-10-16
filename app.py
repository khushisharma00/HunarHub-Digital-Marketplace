from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv


import os
import io
import base64
import urllib.parse
import qrcode
from werkzeug.utils import secure_filename

from flask import Flask, render_template, request, redirect, url_for, flash, session
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

load_dotenv()

UPLOAD_FOLDER = os.path.join(
    app.root_path,
    "static",
    "uploads"
)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
app.config["TEMPLATES_AUTO_RELOAD"] = True

os.makedirs(
    app.config["UPLOAD_FOLDER"],
    exist_ok=True
)

# Session और flash messages के लिए
SECRET_KEY = os.getenv("SECRET_KEY", "hunarhub-secret-key-2026")
app.secret_key = SECRET_KEY

password_reset_serializer = URLSafeTimedSerializer(
    SECRET_KEY
)

DATABASE = "hunarhub.db"


# Database connection
def get_db_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection

def send_password_reset_email(to_email, reset_url):
    sender_email = os.getenv("MAIL_USERNAME")
    app_password = os.getenv("MAIL_APP_PASSWORD")

    if not sender_email or not app_password:
        raise RuntimeError(
            "Email credentials are not configured."
        )

    message = EmailMessage()

    message["Subject"] = "Reset your HunarHub password"
    message["From"] = sender_email
    message["To"] = to_email

    message.set_content(
        f"""
Hello,

We received a request to reset your HunarHub password.

Open this link to create a new password:

{reset_url}

This link expires in 30 minutes.

If you did not request a password reset,
you can ignore this email.

HunarHub
"""
    )

    with smtplib.SMTP_SSL(
        "smtp.gmail.com",
        465
    ) as smtp:

        smtp.login(
            sender_email,
            app_password
        )

        smtp.send_message(message)


# Create database tables
def create_database():

    connection = get_db_connection()

    # Users table
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'customer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # Products table
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            seller TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT NOT NULL,
            description TEXT
        )
        """
    )

        # Add seller_id to existing products table if it does not exist
    product_columns = connection.execute(
        "PRAGMA table_info(products)"
    ).fetchall()

    existing_product_columns = [
        column["name"] for column in product_columns
    ]

    if "seller_id" not in existing_product_columns:
        try:
            connection.execute(
                "ALTER TABLE products ADD COLUMN seller_id INTEGER"
            )
        except sqlite3.OperationalError:
            # If another process added the column concurrently, ignore the error
            pass

    # Ensure cart table exists (with UNIQUE constraint)
    connection.execute("""
    CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        UNIQUE(user_id, product_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
    )
    """)

    product_count = connection.execute(
        "SELECT COUNT(*) FROM products"
    ).fetchone()[0]

    if product_count == 0:

        demo_products = [
            (
                "Hand-Painted Terracotta Vase",
                "Pottery",
                "Meera Crafts",
                799,
                "pottery.jpg",
                "A beautiful hand-painted terracotta vase made by a local artisan."
            ),
            (
                "Traditional Handloom Stole",
                "Textiles",
                "Asha Handlooms",
                1249,
                "textiles.jpg",
                "A traditional handloom stole made using locally woven fabric."
            ),
            (
                "Traditional Silver Necklace",
                "Jewellery",
                "Noor Jewellery",
                1899,
                "jewellery.jpg",
                "An elegant handcrafted silver-style necklace."
            ),
            (
                "Hand-Carved Wooden Box",
                "Woodcraft",
                "Arjun Woodworks",
                999,
                "woodcraft.jpg",
                "A decorative hand-carved wooden storage box."
            )
        ]

        connection.executemany(
            """
            INSERT INTO products (
                name,
                category,
                seller,
                price,
                image,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            demo_products
        )

    connection.execute("""
    CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        UNIQUE(user_id, product_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
    )
    """)

    connection.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'Placed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        full_name TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        pincode TEXT,
        payment_method TEXT,
        payment_status TEXT DEFAULT 'Pending'
    )
    """) 

    connection.execute("""
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL
    )
    """)

    # =========================
    # ORDERS COLUMN MIGRATIONS
    # =========================
    order_columns = [
        col["name"] for col in connection.execute("PRAGMA table_info(orders)").fetchall()
    ]

    needed_order_cols = {
        "status": "TEXT DEFAULT 'Placed'",
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "order_date": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "full_name": "TEXT",
        "phone": "TEXT",
        "address": "TEXT",
        "city": "TEXT",
        "state": "TEXT",
        "pincode": "TEXT",
        "payment_method": "TEXT",
        "payment_status": "TEXT DEFAULT 'Pending'"
    }

    for col_name, col_def in needed_order_cols.items():
        if col_name not in order_columns:
            try:
                connection.execute(f"ALTER TABLE orders ADD COLUMN {col_name} {col_def}")
            except sqlite3.OperationalError:
                pass

    connection.commit()
    connection.close()


# Homepage
@app.route("/")
def home():

    connection = get_db_connection()

    products = connection.execute(
        "SELECT * FROM products ORDER BY id ASC LIMIT 5"
    ).fetchall()

    connection.close()

    return render_template(
        "index.html",
        products=products
    )

# Register
@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        full_name = request.form.get("full_name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")
        role = request.form.get("role", "customer")

        # Empty fields check
        if not full_name or not email or not password or not confirm_password:
            flash("Please fill in all required fields.", "danger")
            return redirect(url_for("register"))

        # Password match check
        if password != confirm_password:
            flash("Passwords do not match.", "danger")
            return redirect(url_for("register"))

        # Password length check
        if len(password) < 6:
            flash("Password must contain at least 6 characters.", "danger")
            return redirect(url_for("register"))

        # केवल valid roles
        if role not in ["customer", "entrepreneur"]:
            role = "customer"

        password_hash = generate_password_hash(password)

        connection = get_db_connection()

        existing_user = connection.execute(
            "SELECT id FROM users WHERE email = ?",
            (email,)
        ).fetchone()

        if existing_user:
            connection.close()
            flash("An account with this email already exists.", "warning")
            return redirect(url_for("register"))

        connection.execute(
            """
            INSERT INTO users (full_name, email, password, role)
            VALUES (?, ?, ?, ?)
            """,
            (full_name, email, password_hash, role)
        )

        connection.commit()
        connection.close()

        flash("Registration successful. Please log in.", "success")
        return redirect(url_for("login"))

    return render_template("register.html")


# Login
@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        if not email or not password:
            flash("Please enter your email and password.", "danger")
            return redirect(url_for("login"))

        connection = get_db_connection()

        user = connection.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,)
        ).fetchone()

        connection.close()

        if user and check_password_hash(user["password"], password):

            session["user_id"] = user["id"]
            session["user_name"] = user["full_name"]
            session["user_role"] = user["role"]

            flash(f"Welcome back, {user['full_name']}!", "success")

            if user["role"] == "entrepreneur":
             return redirect(url_for("seller_dashboard"))

            elif user["role"] == "admin":
              return redirect(url_for("admin_dashboard"))

            else:
             return redirect(url_for("dashboard"))

        flash("Invalid email or password.", "danger")

    return render_template("login.html")

@app.route("/forgot_password", methods=["GET", "POST"])
def forgot_password():

    if request.method == "POST":

        email = request.form.get(
            "email",
            ""
        ).strip().lower()

        if not email:
            flash(
                "Please enter your email address.",
                "danger"
            )
            return redirect(
                url_for("forgot_password")
            )

        connection = get_db_connection()

        user = connection.execute(
            """
            SELECT id, email
            FROM users
            WHERE email = ?
            """,
            (email,)
        ).fetchone()

        connection.close()

        if user:

            token = password_reset_serializer.dumps(
                email,
                salt="password-reset"
            )

            reset_url = url_for(
                "reset_password",
                token=token,
                _external=True
            )

            try:
                send_password_reset_email(
                    email,
                    reset_url
                )

            except Exception as error:

                print(
                    "PASSWORD RESET EMAIL ERROR:",
                    error
                )

                flash(
                    "Unable to send reset email right now.",
                    "danger"
                )

                return redirect(
                    url_for("forgot_password")
                )

        flash(
            "If an account exists with that email, "
            "a password reset link has been sent.",
            "success"
        )

        return redirect(
            url_for("login")
        )

    return render_template(
        "forgot_password.html"
    )

@app.route(
    "/reset_password/<token>",
    methods=["GET", "POST"]
)
def reset_password(token):

    try:

        email = password_reset_serializer.loads(
            token,
            salt="password-reset",
            max_age=1800
        )

    except SignatureExpired:

        flash(
            "This password reset link has expired.",
            "danger"
        )

        return redirect(
            url_for("forgot_password")
        )

    except BadSignature:

        flash(
            "Invalid password reset link.",
            "danger"
        )

        return redirect(
            url_for("forgot_password")
        )

    if request.method == "POST":

        password = request.form.get(
            "password",
            ""
        )

        confirm_password = request.form.get(
            "confirm_password",
            ""
        )

        if len(password) < 6:

            flash(
                "Password must contain at least 6 characters.",
                "danger"
            )

            return redirect(
                url_for(
                    "reset_password",
                    token=token
                )
            )

        if password != confirm_password:

            flash(
                "Passwords do not match.",
                "danger"
            )

            return redirect(
                url_for(
                    "reset_password",
                    token=token
                )
            )

        password_hash = generate_password_hash(
            password
        )

        connection = get_db_connection()

        connection.execute(
            """
            UPDATE users
            SET password = ?
            WHERE email = ?
            """,
            (
                password_hash,
                email
            )
        )

        connection.commit()
        connection.close()

        flash(
            "Password reset successfully. "
            "You can now log in.",
            "success"
        )

        return redirect(
            url_for("login")
        )

    return render_template(
        "reset_password.html"
    )


@app.route("/dashboard")
def dashboard():

    if "user_id" not in session:
        flash("Please login to access your dashboard.", "warning")
        return redirect(url_for("login"))

    # Role-based dashboard protection
    if session.get("user_role") == "entrepreneur":
     return redirect(url_for("seller_dashboard"))

    if session.get("user_role") == "admin":
     return redirect(url_for("admin_dashboard"))

    connection = get_db_connection()

    user_id = session["user_id"]

    total_orders = connection.execute(
        """
        SELECT COUNT(*)
        FROM orders
        WHERE user_id = ?
        """,
        (user_id,)
    ).fetchone()[0]

    wishlist_count = connection.execute(
    """
    SELECT COUNT(*)
    FROM wishlist
    JOIN products
        ON wishlist.product_id = products.id
    WHERE wishlist.user_id = ?
    """,
    (session["user_id"],)
    ).fetchone()[0] 

    cart_count = connection.execute(
        """
        SELECT COALESCE(SUM(quantity), 0)
        FROM cart
        WHERE user_id = ?
        """,
        (user_id,)
    ).fetchone()[0]

    connection.close()

    return render_template(
        "dashboard.html",
        total_orders=total_orders,
        wishlist_count=wishlist_count,
        cart_count=cart_count
    )


@app.route("/seller_dashboard")
def seller_dashboard():

    if "user_id" not in session:
        flash("Please login to access seller dashboard.", "warning")
        return redirect(url_for("login"))

    if session.get("user_role") != "entrepreneur":
        flash("Only entrepreneurs can access the seller dashboard.", "danger")
        return redirect(url_for("dashboard"))

    connection = get_db_connection()

    products = connection.execute(
        """
        SELECT *
        FROM products
        WHERE seller_id = ?
        ORDER BY id DESC
        """,
        (session["user_id"],)
    ).fetchall()

    # Seller statistics
    seller_id = session["user_id"]

    total_products = connection.execute(
        """
        SELECT COUNT(*)
        FROM products
        WHERE seller_id = ?
        """,
        (seller_id,)
    ).fetchone()[0]

    seller_orders = connection.execute(
        """
        SELECT COUNT(DISTINCT orders.id)
        FROM orders
        JOIN order_items
            ON orders.id = order_items.order_id
        JOIN products
            ON order_items.product_id = products.id
        WHERE products.seller_id = ?
        """,
        (seller_id,)
    ).fetchone()[0]

    total_revenue = connection.execute(
        """
        SELECT COALESCE(
            SUM(order_items.price * order_items.quantity),
            0
        )
        FROM order_items
        JOIN products
            ON order_items.product_id = products.id
        WHERE products.seller_id = ?
        """,
        (seller_id,)
    ).fetchone()[0]


     # Pending seller orders
    pending_orders = connection.execute(
        """
        SELECT COUNT(DISTINCT orders.id)
        FROM orders
        JOIN order_items
            ON orders.id = order_items.order_id
        JOIN products
            ON order_items.product_id = products.id
        WHERE products.seller_id = ?
          AND orders.status IN ('Placed', 'Confirmed', 'Shipped')
        """,
        (seller_id,)
    ).fetchone()[0]


    # Recent orders received by this seller
    recent_orders = connection.execute(
        """
        SELECT
            orders.id AS order_id,
            orders.status,
            orders.created_at,
            users.full_name AS customer_name,
            SUM(
                order_items.price * order_items.quantity
            ) AS seller_amount,
            SUM(order_items.quantity) AS total_quantity
        FROM orders

        JOIN users
            ON orders.user_id = users.id

        JOIN order_items
            ON orders.id = order_items.order_id

        JOIN products
            ON order_items.product_id = products.id

        WHERE products.seller_id = ?

        GROUP BY
            orders.id,
            orders.status,
            orders.created_at,
            users.full_name

        ORDER BY orders.id DESC
        LIMIT 8
        """,
        (seller_id,)
    ).fetchall()

    connection.close()

    return render_template(
           "seller_dashboard.html",
            products=products,
            total_products=total_products,
            total_orders=seller_orders,
            total_revenue=total_revenue,
            pending_orders=pending_orders,
            recent_orders=recent_orders
)

@app.route("/profile", methods=["GET", "POST"])
def profile():

    if "user_id" not in session:
        flash("Please login to access your profile.", "warning")
        return redirect(url_for("login"))

    connection = get_db_connection()

    user = connection.execute(
        """
        SELECT id, full_name, email, role
        FROM users
        WHERE id = ?
        """,
        (session["user_id"],)
    ).fetchone()

    if not user:
        connection.close()
        session.clear()
        flash("User account not found.", "danger")
        return redirect(url_for("login"))

    if request.method == "POST":

        full_name = request.form.get("full_name", "").strip()
        email = request.form.get("email", "").strip().lower()

        if not full_name or not email:
            connection.close()
            flash("Name and email are required.", "danger")
            return redirect(url_for("profile"))

        existing_user = connection.execute(
            """
            SELECT id
            FROM users
            WHERE email = ?
              AND id != ?
            """,
            (email, session["user_id"])
        ).fetchone()

        if existing_user:
            connection.close()
            flash("This email is already registered.", "danger")
            return redirect(url_for("profile"))

        connection.execute(
            """
            UPDATE users
            SET full_name = ?,
                email = ?
            WHERE id = ?
            """,
            (
                full_name,
                email,
                session["user_id"]
            )
        )

        connection.commit()

        session["user_name"] = full_name

        connection.close()

        flash("Profile updated successfully.", "success")

        return redirect(url_for("profile"))

    connection.close()

    return render_template(
        "profile.html",
        user=user
    )

@app.route("/change_password", methods=["GET", "POST"])
def change_password():

    if "user_id" not in session:
        flash("Please login first.", "warning")
        return redirect(url_for("login"))

    if request.method == "POST":

        current_password = request.form.get("current_password", "")
        new_password = request.form.get("new_password", "")
        confirm_password = request.form.get("confirm_password", "")

        connection = get_db_connection()

        user = connection.execute(
            """
            SELECT id, password
            FROM users
            WHERE id = ?
            """,
            (session["user_id"],)
        ).fetchone()

        if not user:
            connection.close()
            session.clear()
            flash("User account not found.", "danger")
            return redirect(url_for("login"))

        if not check_password_hash(
            user["password"],
            current_password
        ):
            connection.close()

            flash(
                "Current password is incorrect.",
                "danger"
            )

            return redirect(
                url_for("change_password")
            )

        if len(new_password) < 8:
            connection.close()

            flash(
                "New password must be at least 8 characters long.",
                "danger"
            )

            return redirect(
                url_for("change_password")
            )

        if new_password != confirm_password:
            connection.close()

            flash(
                "New password and confirm password do not match.",
                "danger"
            )

            return redirect(
                url_for("change_password")
            )

        if check_password_hash(
            user["password"],
            new_password
        ):
            connection.close()

            flash(
                "New password must be different from your current password.",
                "warning"
            )

            return redirect(
                url_for("change_password")
            )

        hashed_password = generate_password_hash(
            new_password
        )

        connection.execute(
            """
            UPDATE users
            SET password = ?
            WHERE id = ?
            """,
            (
                hashed_password,
                session["user_id"]
            )
        )

        connection.commit()
        connection.close()

        flash(
            "Password changed successfully.",
            "success"
        )

        return redirect(
            url_for("profile")
        )

    return render_template(
        "change_password.html"
    )

@app.route(
    "/seller/order/<int:order_id>/status",
    methods=["POST"]
)
def seller_update_order_status(order_id):

    if "user_id" not in session:
        flash("Please login first.", "warning")
        return redirect(url_for("login"))

    if session.get("user_role") != "entrepreneur":
        flash("Only entrepreneurs can manage orders.", "danger")
        return redirect(url_for("dashboard"))

    new_status = request.form.get("status", "").strip()

    allowed_statuses = [
        "Placed",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled"
    ]

    if new_status not in allowed_statuses:
        flash("Invalid order status.", "danger")
        return redirect(url_for("seller_dashboard"))

    seller_id = session["user_id"]

    connection = get_db_connection()

    # Check that this order actually contains
    # a product belonging to this seller
    seller_order = connection.execute(
        """
        SELECT orders.id
        FROM orders

        JOIN order_items
            ON orders.id = order_items.order_id

        JOIN products
            ON order_items.product_id = products.id

        WHERE orders.id = ?
          AND products.seller_id = ?

        LIMIT 1
        """,
        (order_id, seller_id)
    ).fetchone()

    if seller_order is None:
        connection.close()

        flash(
            "You are not authorised to manage this order.",
            "danger"
        )

        return redirect(url_for("seller_dashboard"))

    connection.execute(
        """
        UPDATE orders
        SET status = ?
        WHERE id = ?
        """,
        (new_status, order_id)
    )

    connection.commit()
    connection.close()

    flash(
        f"Order #{order_id} updated to {new_status}.",
        "success"
    )

    return redirect(url_for("seller_dashboard"))

@app.route("/add_product", methods=["GET", "POST"])
def add_product():

    if "user_id" not in session:
        flash("Please login first.", "warning")
        return redirect(url_for("login"))

    if session.get("user_role") != "entrepreneur":
        flash("Only entrepreneurs can add products.", "danger")
        return redirect(url_for("dashboard"))

    if request.method == "POST":

        name = request.form.get("name", "").strip()
        category = request.form.get("category", "").strip()
        price = request.form.get("price", "").strip()
        description = request.form.get("description", "").strip()
        seller = request.form.get("seller", "").strip()
        stock = request.form.get("stock")

        image_file = request.files.get("image")

        if not all([name, category, price, description, seller]):
            flash("Please fill in all product details.", "danger")
            return redirect(url_for("add_product"))

        if not image_file or not image_file.filename:
            flash("Please select a product image.", "danger")
            return redirect(url_for("add_product"))

        if not stock or not stock.isdigit():
            flash("Please enter a valid stock quantity.", "danger")
            return redirect(url_for("add_product"))

        stock = int(stock)

        filename = secure_filename(image_file.filename or "")

        allowed_extensions = {"png", "jpg", "jpeg", "webp"}

        if "." not in filename:
            flash("Invalid image file.", "danger")
            return redirect(url_for("add_product"))

        extension = filename.rsplit(".", 1)[1].lower()

        if extension not in allowed_extensions:
            flash(
                "Please upload PNG, JPG, JPEG or WEBP.",
                "danger"
            )
            return redirect(url_for("add_product"))

        os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

        image_file.save(
            os.path.join(app.config["UPLOAD_FOLDER"], filename)
        )

        connection = get_db_connection()

        connection.execute(
            """
            INSERT INTO products
            (name, category, seller, price, image, description, seller_id, stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                category,
                seller,
                price,
                filename,
                description,
                session["user_id"],
                stock
            )
        )

        connection.commit()
        connection.close()

        flash("Product added successfully!", "success")

        return redirect(url_for("seller_dashboard"))

    return render_template("add_product.html")

@app.route("/admin_dashboard")
def admin_dashboard():

    if "user_id" not in session:
        flash("Please login to access admin dashboard.", "warning")
        return redirect(url_for("login"))

    if session.get("user_role") != "admin":
        flash("Admin access only.", "danger")

        if session.get("user_role") == "entrepreneur":
            return redirect(url_for("seller_dashboard"))

        return redirect(url_for("dashboard"))

    connection = get_db_connection()

    total_users = connection.execute(
        "SELECT COUNT(*) FROM users"
    ).fetchone()[0]

    total_products = connection.execute(
        "SELECT COUNT(*) FROM products"
    ).fetchone()[0]

    total_orders = connection.execute(
        "SELECT COUNT(*) FROM orders"
    ).fetchone()[0]

    total_revenue = connection.execute(
        """
        SELECT COALESCE(SUM(total_amount), 0)
        FROM orders
        WHERE status != 'Cancelled'
        """
    ).fetchone()[0]

    users = connection.execute(
        """
        SELECT
            id,
            full_name,
            email,
            role,
            created_at
        FROM users
        ORDER BY id DESC
        LIMIT 10
        """
    ).fetchall()

    products = connection.execute(
        """
        SELECT
            id,
            name,
            category,
            seller,
            price,
            seller_id
        FROM products
        ORDER BY id DESC
        LIMIT 10
        """
    ).fetchall()

    recent_orders = connection.execute(
        """
        SELECT
            orders.id,
            orders.total_amount,
            orders.status,
            orders.created_at,
            orders.payment_method,
            orders.payment_status,
            users.full_name AS customer_name
        FROM orders

        JOIN users
            ON orders.user_id = users.id

        ORDER BY orders.id DESC
        LIMIT 10
        """
    ).fetchall()

    connection.close()

    return render_template(
        "admin_dashboard.html",
        total_users=total_users,
        total_products=total_products,
        total_orders=total_orders,
        total_revenue=total_revenue,
        users=users,
        products=products,
        recent_orders=recent_orders
    )

@app.route("/admin/delete_user/<int:user_id>")
def admin_delete_user(user_id):

    if "user_id" not in session:
        flash("Please login first.", "warning")
        return redirect(url_for("login"))

    if session.get("user_role") != "admin":
        flash("Admin access only.", "danger")
        return redirect(url_for("dashboard"))

    if user_id == session["user_id"]:
        flash(
            "You cannot delete your own admin account.",
            "warning"
        )
        return redirect(url_for("admin_dashboard"))

    connection = get_db_connection()

    user = connection.execute(
        """
        SELECT id, role
        FROM users
        WHERE id = ?
        """,
        (user_id,)
    ).fetchone()

    if user is None:
        connection.close()
        flash("User not found.", "warning")
        return redirect(url_for("admin_dashboard"))

    # Do not allow deleting another admin account
    if user["role"] == "admin":
        connection.close()
        flash(
            "Admin accounts cannot be deleted from this dashboard.",
            "danger"
        )
        return redirect(url_for("admin_dashboard"))

    # Remove user's wishlist items
    connection.execute(
        """
        DELETE FROM wishlist
        WHERE user_id = ?
        """,
        (user_id,)
    )

    # Remove user's cart items
    connection.execute(
        """
        DELETE FROM cart
        WHERE user_id = ?
        """,
        (user_id,)
    )

    # If entrepreneur, remove their products safely
    if user["role"] == "entrepreneur":

        seller_products = connection.execute(
            """
            SELECT id
            FROM products
            WHERE seller_id = ?
            """,
            (user_id,)
        ).fetchall()

        for product in seller_products:

            product_id = product["id"]

            connection.execute(
                """
                DELETE FROM wishlist
                WHERE product_id = ?
                """,
                (product_id,)
            )

            connection.execute(
                """
                DELETE FROM cart
                WHERE product_id = ?
                """,
                (product_id,)
            )

        connection.execute(
            """
            DELETE FROM products
            WHERE seller_id = ?
            """,
            (user_id,)
        )

    # Keep orders and order_items for history

    connection.execute(
        """
        DELETE FROM users
        WHERE id = ?
        """,
        (user_id,)
    )

    connection.commit()
    connection.close()

    flash(
        "User deleted successfully.",
        "success"
    )

    return redirect(url_for("admin_dashboard"))

@app.route("/logout")
def logout():

    session.clear()

    flash(
        "You have been logged out successfully.",
        "success"
    )

    return redirect(url_for("home"))


@app.route("/admin/delete_product/<int:product_id>")
def admin_delete_product(product_id):

    if "user_id" not in session:
        flash("Please login first.", "warning")
        return redirect(url_for("login"))

    if session.get("user_role") != "admin":
        flash("Admin access only.", "danger")
        return redirect(url_for("dashboard"))

    connection = get_db_connection()

    product = connection.execute(
        """
        SELECT id
        FROM products
        WHERE id = ?
        """,
        (product_id,)
    ).fetchone()

    if product is None:
        connection.close()
        flash("Product not found.", "warning")
        return redirect(url_for("admin_dashboard"))

    # Remove product from customer wishlists
    connection.execute(
        """
        DELETE FROM wishlist
        WHERE product_id = ?
        """,
        (product_id,)
    )

    # Remove product from customer carts
    connection.execute(
        """
        DELETE FROM cart
        WHERE product_id = ?
        """,
        (product_id,)
    )

    # Keep order_items untouched so old order history is preserved

    connection.execute(
        """
        DELETE FROM products
        WHERE id = ?
        """,
        (product_id,)
    )

    connection.commit()
    connection.close()

    flash("Product deleted successfully.", "success")

    return redirect(url_for("admin_dashboard"))

@app.route(
    "/admin/order/<int:order_id>/status",
    methods=["POST"]
)
def admin_update_order_status(order_id):

    if session.get("user_role") != "admin":
        flash("Admin access only.", "danger")
        return redirect(url_for("login"))

    new_status = request.form.get("status", "").strip()

    allowed_statuses = [
        "Placed",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Cancelled"
    ]

    if new_status not in allowed_statuses:
        flash("Invalid order status.", "danger")
        return redirect(url_for("admin_dashboard"))

    connection = get_db_connection()

    connection.execute(
        """
        UPDATE orders
        SET status = ?
        WHERE id = ?
        """,
        (new_status, order_id)
    )

    connection.commit()
    connection.close()

    flash(
        f"Order #{order_id} updated successfully.",
        "success"
    )

    return redirect(url_for("admin_dashboard"))

@app.route("/edit_product/<int:product_id>", methods=["GET", "POST"])
def edit_product(product_id):

    if "user_id" not in session:
        flash("Please login first.", "warning")
        return redirect(url_for("login"))

    if session.get("user_role") != "entrepreneur":
        flash("Only entrepreneurs can edit products.", "danger")
        return redirect(url_for("dashboard"))

    connection = get_db_connection()

    product = connection.execute(
        """
        SELECT *
        FROM products
        WHERE id = ?
          AND seller_id = ?
        """,
        (
            product_id,
            session["user_id"]
        )
    ).fetchone()

    if product is None:
        connection.close()

        flash(
            "Product not found or you are not authorised to edit it.",
            "danger"
        )

        return redirect(url_for("seller_dashboard"))

    if request.method == "POST":

        name = request.form.get("name", "").strip()
        category = request.form.get("category", "").strip()
        price = request.form.get("price", "").strip()
        description = request.form.get("description", "").strip()
        seller = request.form.get("seller", "").strip()
        image = request.form.get("image", "").strip()

        if not all([
            name,
            category,
            price,
            description,
            seller
        ]):
            connection.close()

            flash(
                "Please fill in all product details.",
                "danger"
            )

            return redirect(
                url_for(
                    "edit_product",
                    product_id=product_id
                )
            )

        connection.execute(
            """
            UPDATE products
            SET
                name = ?,
                category = ?,
                price = ?,
                description = ?,
                image = ?,
                seller = ?
            WHERE id = ?
              AND seller_id = ?
            """,
            (
                name,
                category,
                float(price),
                description,
                image or product["image"],
                seller,
                product_id,
                session["user_id"]
            )
        )

        connection.commit()
        connection.close()

        flash(
            "Product updated successfully.",
            "success"
        )

        return redirect(
            url_for("seller_dashboard")
        )

    connection.close()

    return render_template(
        "edit_product.html",
        product=product
    )

@app.route("/delete_product/<int:product_id>")
def delete_product(product_id):

    if "user_id" not in session:
        flash("Please login first.", "warning")
        return redirect(url_for("login"))

    if session.get("user_role") != "entrepreneur":
        flash("Only entrepreneurs can delete products.", "danger")
        return redirect(url_for("dashboard"))

    connection = get_db_connection()

    product = connection.execute(
        """
        SELECT id
        FROM products
        WHERE id = ?
          AND seller_id = ?
        """,
        (
            product_id,
            session["user_id"]
        )
    ).fetchone()

    if product is None:
        connection.close()

        flash(
            "Product not found or you are not authorised to delete it.",
            "danger"
        )

        return redirect(url_for("seller_dashboard"))

    # Remove product from wishlists
    connection.execute(
        """
        DELETE FROM wishlist
        WHERE product_id = ?
        """,
        (product_id,)
    )

    # Remove product from carts
    connection.execute(
        """
        DELETE FROM cart
        WHERE product_id = ?
        """,
        (product_id,)
    )

    # Keep historical order_items untouched

    connection.execute(
        """
        DELETE FROM products
        WHERE id = ?
          AND seller_id = ?
        """,
        (
            product_id,
            session["user_id"]
        )
    )

    connection.commit()
    connection.close()

    flash("Product deleted successfully.", "success")

    return redirect(url_for("seller_dashboard"))

@app.route("/orders")
def orders():
    if "user_id" not in session:
        return redirect(url_for("login"))

    connection = get_db_connection()

    user_orders = connection.execute(
        """
        SELECT
            id,
            total_amount,
            status,
            created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY id DESC
        """,
        (session["user_id"],)
    ).fetchall()

    connection.close()

    return render_template(
        "orders.html",
        orders=user_orders
    )


@app.route("/cancel_order/<int:order_id>", methods=["POST"])
def cancel_order(order_id):

    if "user_id" not in session:
        flash("Please login first.", "warning")
        return redirect(url_for("login"))

    connection = get_db_connection()

    order = connection.execute(
        """
        SELECT id, status
        FROM orders
        WHERE id = ? AND user_id = ?
        """,
        (order_id, session["user_id"])
    ).fetchone()

    if not order:
        connection.close()
        flash("Order not found.", "danger")
        return redirect(url_for("orders"))

    if order["status"] in ["Shipped", "Delivered", "Cancelled"]:
        connection.close()
        flash(
            "This order can no longer be cancelled.",
            "warning"
        )
        return redirect(url_for("orders"))

    connection.execute(
        """
        UPDATE orders
        SET status = 'Cancelled'
        WHERE id = ? AND user_id = ?
        """,

         (order_id, session["user_id"])
    )

    connection.commit()
    connection.close()

    flash("Order cancelled successfully.", "success")

    return redirect(url_for("orders"))


@app.route("/wishlist")
def wishlist():

    if "user_id" not in session:
        return redirect(url_for("login"))

    connection = get_db_connection()

    wishlist_items = connection.execute(
        """
        SELECT
            wishlist.id AS wishlist_id,
            products.id AS product_id,
            products.name,
            products.category,
            products.seller,
            products.price,
            products.image,
            products.description
        FROM wishlist
        JOIN products
            ON wishlist.product_id = products.id
        WHERE wishlist.user_id = ?
        ORDER BY wishlist.id DESC
        """,
        (session["user_id"],)
    ).fetchall()

    connection.close()

    return render_template(
        "wishlist.html",
        wishlist_items=wishlist_items
    )

@app.route("/add_to_cart/<int:product_id>")
def add_to_cart(product_id):
    if "user_id" not in session:
        return redirect(url_for("login"))

    connection = get_db_connection()

    existing_item = connection.execute(
        """
        SELECT id, quantity
        FROM cart
        WHERE user_id = ? AND product_id = ?
        """,
        (session["user_id"], product_id)
    ).fetchone()

    if existing_item:
        connection.execute(
            """
            UPDATE cart
            SET quantity = quantity + 1
            WHERE id = ?
            """,
            (existing_item["id"],)
        )
    else:
        connection.execute(
            """
            INSERT INTO cart (user_id, product_id, quantity)
            VALUES (?, ?, 1)
            """,
            (session["user_id"], product_id)
        )

    connection.commit()
    connection.close()

    return redirect(url_for("cart"))

@app.route("/products")
def products():
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    min_price = request.args.get("min_price", "").strip()
    max_price = request.args.get("max_price", "").strip()
    sort = request.args.get("sort", "").strip()

    connection = get_db_connection()

    query = "SELECT * FROM products WHERE 1=1"
    params: list = []

    if search:
        query += " AND (name LIKE ? OR seller LIKE ? OR category LIKE ?)"
        params.extend([
            f"%{search}%",
            f"%{search}%",
            f"%{search}%"
        ])

    if category:
        query += " AND category = ?"
        params.append(category)

    if min_price:
        query += " AND price >= ?"
        params.append(float(min_price))

    if max_price:
        query += " AND price <= ?"
        params.append(float(max_price))

    if sort == "price_low":
        query += " ORDER BY price ASC"

    elif sort == "price_high":
        query += " ORDER BY price DESC"

    else:
        query += " ORDER BY id DESC"

    product_list = connection.execute(
        query,
        params
    ).fetchall()

    connection.close()

    products_with_folders = []

    for product in product_list:
        product_data = dict(product)

        upload_path = os.path.join(
            app.config["UPLOAD_FOLDER"],
            product_data["image"]
        )

        if os.path.exists(upload_path):
            product_data["image_folder"] = "uploads"
        else:
            product_data["image_folder"] = "images"

        products_with_folders.append(product_data)

    return render_template(
        "products.html",
        products=products_with_folders,
        search=search,
        category=category,
        min_price=min_price,
        max_price=max_price,
        sort=sort
    )

@app.route("/clear_orders")
def clear_orders():

    if "user_id" not in session:
        return redirect(url_for("login"))

    connection = get_db_connection()

    connection.execute(
        "DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)",
        (session["user_id"],)
    )

    connection.execute(
        "DELETE FROM orders WHERE user_id = ?",
        (session["user_id"],)
    )

    connection.commit()
    connection.close()

    return redirect(url_for("orders"))

@app.route("/product/<int:product_id>")
def product_details(product_id):
    connection = get_db_connection()

    product = connection.execute(
        "SELECT * FROM products WHERE id = ?",
        (product_id,)
    ).fetchone()

    connection.close()

    if product is None:
        return "Product not found", 404

    return render_template(
    "products_details.html",
    product=product
)



@app.route("/cart")
def cart():

    if "user_id" not in session:
        return redirect(url_for("login"))

    connection = get_db_connection()

    cart_items = connection.execute(
        """
        SELECT
            cart.id AS cart_id,
            cart.quantity,
            products.id AS product_id,
            products.name,
            products.category,
            products.seller,
            products.price,
            products.image
        FROM cart
        JOIN products
            ON cart.product_id = products.id
        WHERE cart.user_id = ?
        ORDER BY cart.id DESC
        """,
        (session["user_id"],)
    ).fetchall()

    connection.close()

    total = sum(
        item["price"] * item["quantity"]
        for item in cart_items
    )

    return render_template(
        "cart.html",
        cart_items=cart_items,
        total=total
    )

@app.route("/clear_cart")
def clear_cart():

    if "user_id" not in session:
        return redirect(url_for("login"))

    connection = get_db_connection()

    connection.execute(
        "DELETE FROM cart WHERE user_id = ?",
        (session["user_id"],)
    )

    connection.commit()
    connection.close()

    return redirect(url_for("cart"))

@app.route("/increase_cart/<int:cart_id>")
def increase_cart(cart_id):

    if "user_id" not in session:
        return redirect(url_for("login"))

    connection = get_db_connection()

    connection.execute(
        """
        UPDATE cart
        SET quantity = quantity + 1
        WHERE id = ? AND user_id = ?
        """,
        (cart_id, session["user_id"])
    )

    connection.commit()
    connection.close()

    return redirect(url_for("cart"))


@app.route("/decrease_cart/<int:cart_id>")
def decrease_cart(cart_id):

    if "user_id" not in session:
        return redirect(url_for("login"))

    connection = get_db_connection()

    item = connection.execute(
        """
        SELECT quantity
        FROM cart
        WHERE id = ? AND user_id = ?
        """,
        (cart_id, session["user_id"])
    ).fetchone()

    if item:

        if item["quantity"] > 1:

            connection.execute(
                """
                UPDATE cart
                SET quantity = quantity - 1
                WHERE id = ? AND user_id = ?
                """,
                (cart_id, session["user_id"])
            )

        else:

            connection.execute(
                """
                DELETE FROM cart
                WHERE id = ? AND user_id = ?
                """,
                (cart_id, session["user_id"])
            )

    connection.commit()
    connection.close()

    return redirect(url_for("cart"))


@app.route("/remove_from_cart/<int:cart_id>")
def remove_from_cart(cart_id):
    if "user_id" not in session:
        return redirect(url_for("login"))

    connection = get_db_connection()

    connection.execute(
        """
        DELETE FROM cart
        WHERE id = ? AND user_id = ?
        """,
        (cart_id, session["user_id"])
    )

    connection.commit()
    connection.close()

    return redirect(url_for("cart"))


@app.route("/checkout", methods=["GET", "POST"])
def checkout():

    if "user_id" not in session:
        return redirect(url_for("login"))

    connection = get_db_connection()

    cart_items = connection.execute(
        """
        SELECT
            cart.product_id,
            cart.quantity,
            products.name,
            products.price
        FROM cart
        JOIN products
            ON cart.product_id = products.id
        WHERE cart.user_id = ?
        """,
        (session["user_id"],)
    ).fetchall()

    if not cart_items:
        connection.close()
        flash("Your cart is empty.", "warning")
        return redirect(url_for("cart"))

    total = sum(
        item["price"] * item["quantity"]
        for item in cart_items
    )

        # Create UPI payment link
    upi_id = os.getenv("HUNARHUB_UPI_ID") or "hunarhub@upi"

    upi_params = {
        "pa": upi_id,
        "pn": "HunarHub",
        "am": f"{total:.2f}",
        "cu": "INR",
        "tn": "HunarHub Order Payment"
    }

    upi_url = "upi://pay?" + urllib.parse.urlencode(
        upi_params
    )

    qr_code = ""
    try:
        qr = qrcode.make(upi_url)
        buffer = io.BytesIO()
        qr.save(buffer, "PNG")
        qr_code = base64.b64encode(
            buffer.getvalue()
        ).decode("utf-8")
    except Exception as e:
        qr_code = ""

    connection.close()

    return render_template(
        "checkout.html",
        cart_items=cart_items,
        total=total,
        upi_url=upi_url,
        qr_code=qr_code,
        upi_id=upi_id
    )
    


@app.route("/place_order", methods=["POST"])
def place_order():

    if "user_id" not in session:
        return redirect(url_for("login"))

    full_name = request.form.get("full_name")
    phone = request.form.get("phone")
    address = request.form.get("address")
    city = request.form.get("city")
    state = request.form.get("state")
    pincode = request.form.get("pincode")
    payment_method = request.form.get("payment_method")

    if not all([
        full_name,
        phone,
        address,
        city,
        state,
        pincode,
        payment_method
    ]):
        flash("Please fill all checkout details.", "danger")
        return redirect(url_for("checkout"))

    connection = get_db_connection()

    cart_items = connection.execute(
        """
        SELECT
            cart.product_id,
            cart.quantity,
            products.price
        FROM cart
        JOIN products
            ON cart.product_id = products.id
        WHERE cart.user_id = ?
        """,
        (session["user_id"],)
    ).fetchall()

    if not cart_items:
        connection.close()
        flash("Your cart is empty.", "warning")
        return redirect(url_for("cart"))

    total = sum(
        item["price"] * item["quantity"]
        for item in cart_items
    )
    if payment_method == "Cash on Delivery":
        payment_status = "Pending"
    elif payment_method == "UPI":
        payment_status = "Paid"
    elif payment_method in ["Card", "Credit / Debit Card"]:
        card_num = (request.form.get("card_number") or "").replace(" ", "")
        last4 = card_num[-4:] if len(card_num) >= 4 else "••••"
        payment_method = f"Card ending in {last4}"
        payment_status = "Paid"
    else:
        payment_status = "Pending"


    cursor = connection.execute(
        """
        INSERT INTO orders
        (
            user_id,
            total_amount,
            status,
            full_name,
            phone,
            address,
            city,
            state,
            pincode,
            payment_method,
            payment_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            session["user_id"],
            total,
            "Placed",
            full_name,
            phone,
            address,
            city,
            state,
            pincode,
            payment_method,
            payment_status
        )
    )

    order_id = cursor.lastrowid

    for item in cart_items:

        connection.execute(
            """
            INSERT INTO order_items
            (
                order_id,
                product_id,
                quantity,
                price
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                order_id,
                item["product_id"],
                item["quantity"],
                item["price"]
            )
        )

    connection.execute(
        """
        DELETE FROM cart
        WHERE user_id = ?
        """,
        (session["user_id"],)
    )

    connection.commit()
    connection.close()

    flash(
        f"Order #{order_id} placed successfully!",
        "success"
    )

    return redirect(url_for("orders"))

@app.route("/add_to_wishlist/<int:product_id>")
def add_to_wishlist(product_id):

    if "user_id" not in session:
        return redirect(url_for("login"))

    connection = get_db_connection()

    connection.execute(
        """
        INSERT OR IGNORE INTO wishlist (user_id, product_id)
        VALUES (?, ?)
        """,
        (session["user_id"], product_id)
    )

    connection.commit()

    saved_item = connection.execute(
        """
        SELECT * FROM wishlist
        WHERE user_id = ? AND product_id = ?
        """,
        (session["user_id"], product_id)
    ).fetchone()

    print("SAVED WISHLIST ITEM:", saved_item)

    connection.close()

    return redirect(url_for("wishlist"))

@app.route(
    "/remove_from_wishlist/<int:wishlist_id>",
    methods=["POST"]
)
def remove_from_wishlist(wishlist_id):

    if "user_id" not in session:
        return redirect(url_for("login"))

    connection = get_db_connection()

    connection.execute(
        """
        DELETE FROM wishlist
        WHERE id = ? AND user_id = ?
        """,
        (wishlist_id, session["user_id"])
    )

    connection.commit()
    connection.close()

    return redirect(url_for("wishlist"))


@app.after_request
def add_no_cache_headers(response):
    if request.path.startswith('/static/'):
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
    return response


if __name__ == "__main__":
    create_database()
    app.run(debug=True, port=5002)