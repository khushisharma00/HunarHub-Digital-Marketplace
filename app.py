import os
from werkzeug.utils import secure_filename

from flask import Flask, render_template, request, redirect, url_for, flash, session
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

UPLOAD_FOLDER = os.path.join(
    app.root_path,
    "static",
    "uploads"
)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

os.makedirs(
    app.config["UPLOAD_FOLDER"],
    exist_ok=True
)

# Session और flash messages के लिए
app.secret_key = "hunarhub-secret-key-2026"

DATABASE = "hunarhub.db"


# Database connection
def get_db_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


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

    connection.execute("""
CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_id INTEGER,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
)
""")
    
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
        
    connection.execute(
    """
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Placed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """
)

    connection.execute(
    """
    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )
    """
) 
    
    connection.execute("""
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
            return redirect(url_for("dashboard"))

        flash("Invalid email or password.", "danger")

    return render_template("login.html")

@app.route("/dashboard")
def dashboard():

    if "user_id" not in session:
        flash("Please login to access your dashboard.", "warning")
        return redirect(url_for("login"))

    return render_template("dashboard.html")

@app.route("/seller_dashboard")
def seller_dashboard():

    connection = get_db_connection()

    products = connection.execute(
        "SELECT * FROM products ORDER BY id DESC"
    ).fetchall()

    connection.close()

    return render_template(
        "seller_dashboard.html",
        products=products
    )

@app.route("/admin_dashboard")
def admin_dashboard():

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

    users = connection.execute(
        "SELECT * FROM users ORDER BY id DESC"
    ).fetchall()

    connection.close()

    return render_template(
        "admin_dashboard.html",
        total_users=total_users,
        total_products=total_products,
        total_orders=total_orders,
        users=users
    )

@app.route("/add_product", methods=["GET", "POST"])
def add_product():

    if request.method == "POST":

        name = request.form.get("name", "").strip()
        category = request.form.get("category", "").strip()
        price = request.form.get("price", "").strip()
        description = request.form.get("description", "").strip()
        seller = request.form.get("seller", "").strip()

        image_file = request.files.get("image")

        if not all([
            name,
            category,
            price,
            description,
            seller
        ]):
            flash("Please fill in all product details.", "danger")
            return redirect(url_for("add_product"))

        if image_file is None or image_file.filename == "":
            flash("Please select a product image.", "danger")
            return redirect(url_for("add_product"))

        filename = secure_filename(image_file.filename)

        if filename == "":
            flash("Invalid image filename.", "danger")
            return redirect(url_for("add_product"))

        allowed_extensions = {
            "png",
            "jpg",
            "jpeg",
            "webp"
        }

        extension = filename.rsplit(".", 1)[-1].lower()

        if "." not in filename or extension not in allowed_extensions:
            flash(
                "Please upload a PNG, JPG, JPEG or WEBP image.",
                "danger"
            )
            return redirect(url_for("add_product"))

        os.makedirs(
            app.config["UPLOAD_FOLDER"],
            exist_ok=True
        )

        upload_path = os.path.join(
            app.config["UPLOAD_FOLDER"],
            filename
        )

        image_file.save(upload_path)

        connection = get_db_connection()

        connection.execute(
            """
            INSERT INTO products
            (
                name,
                category,
                seller,
                price,
                image,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                category,
                seller,
                float(price),
                filename,
                description
            )
        )

        connection.commit()
        connection.close()

        flash("Product added successfully.", "success")

        return redirect(url_for("seller_dashboard"))

    return render_template("add_product.html")

@app.route("/edit_product/<int:product_id>", methods=["GET", "POST"])
def edit_product(product_id):

    connection = get_db_connection()

    if request.method == "POST":

        connection.execute(
            """
            UPDATE products
            SET
                name=?,
                category=?,
                price=?,
                description=?,
                image=?,
                seller=?
            WHERE id=?
            """,
            (
                request.form["name"],
                request.form["category"],
                request.form["price"],
                request.form["description"],
                request.form["image"],
                request.form["seller"],
                product_id
            )
        )

        connection.commit()
        connection.close()

        return redirect(url_for("seller_dashboard"))

    product = connection.execute(
        "SELECT * FROM products WHERE id=?",
        (product_id,)
    ).fetchone()

    connection.close()

    return render_template(
        "edit_product.html",
        product=product
    )

@app.route("/delete_product/<int:product_id>")
def delete_product(product_id):

    connection = get_db_connection()

    connection.execute(
        "DELETE FROM products WHERE id=?",
        (product_id,)
    )

    connection.commit()
    connection.close()

    return redirect(url_for("seller_dashboard"))

# Logout
@app.route("/logout")
def logout():

    session.clear()
    flash("You have been logged out successfully.", "success")

    return redirect(url_for("home"))


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
    params = []

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


@app.route("/checkout", methods=["POST"])
def checkout():
    if "user_id" not in session:
        return redirect(url_for("login"))

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
        return redirect(url_for("cart"))

    total = sum(
        item["price"] * item["quantity"]
        for item in cart_items
    )

    cursor = connection.execute(
        """
        INSERT INTO orders (user_id, total_amount, status)
        VALUES (?, ?, ?)
        """,
        (session["user_id"], total, "Placed")
    )

    order_id = cursor.lastrowid

    for item in cart_items:
        connection.execute(
            """
            INSERT INTO order_items
            (order_id, product_id, quantity, price)
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


if __name__ == "__main__":
    create_database()
    app.run(debug=True)