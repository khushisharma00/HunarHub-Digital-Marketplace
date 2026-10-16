import pytest
from app import app, get_db_connection

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    with app.test_client() as client:
        yield client

def test_home_page(client):
    """Test public home page loads with 200 OK and theme toggle button"""
    res = client.get("/")
    assert res.status_code == 200
    html = res.data.decode("utf-8")
    assert "Hunar" in html
    assert "themeToggleBtn" in html

def test_static_cache_headers(client):
    """Test that static CSS and JS send no-cache headers to prevent stale browser cache"""
    css_res = client.get("/static/css/style.css")
    assert css_res.status_code == 200
    assert "no-cache" in css_res.headers.get("Cache-Control", "")
    
    js_res = client.get("/static/js/script.js")
    assert js_res.status_code == 200
    assert "no-cache" in js_res.headers.get("Cache-Control", "")

def test_login_page_renders(client):
    """Test login page loads"""
    res = client.get("/login")
    assert res.status_code == 200
    assert "Login" in res.data.decode("utf-8")

def test_login_invalid_credentials(client):
    """Test login fails with invalid password"""
    res = client.post("/login", data={
        "email": "customer@hunarhub.com",
        "password": "wrongpassword123"
    }, follow_redirects=True)
    html = res.data.decode("utf-8")
    assert "Invalid email or password" in html or "Login" in html

def test_login_success_customer(client):
    """Test valid customer login and redirect to dashboard"""
    res = client.post("/login", data={
        "email": "customer@hunarhub.com",
        "password": "customer123"
    }, follow_redirects=True)
    assert res.status_code == 200
    with client.session_transaction() as sess:
        assert sess.get("user_id") is not None
        assert sess.get("user_role") == "customer"

def test_customer_dashboard(client):
    """Test customer dashboard loads with orders, wishlist, cart links and theme toggle"""
    conn = get_db_connection()
    cust = conn.execute("SELECT id, full_name, email, role FROM users WHERE role = 'customer' LIMIT 1").fetchone()
    conn.close()

    with client.session_transaction() as sess:
        sess["user_id"] = cust["id"]
        sess["user_name"] = cust["full_name"]
        sess["user_role"] = "customer"
        sess["user_email"] = cust["email"]
    
    res = client.get("/dashboard")
    assert res.status_code == 200
    html = res.data.decode("utf-8")
    assert "Customer Dashboard" in html or "CUSTOMER DASHBOARD" in html
    assert "themeToggleBtn" in html

def test_profile_page_and_update(client):
    """Test profile page displays user details, has theme toggle, and handles updates"""
    conn = get_db_connection()
    cust = conn.execute("SELECT id, full_name, email, role FROM users WHERE role = 'customer' LIMIT 1").fetchone()
    conn.close()

    with client.session_transaction() as sess:
        sess["user_id"] = cust["id"]
        sess["user_name"] = cust["full_name"]
        sess["user_role"] = "customer"
        sess["user_email"] = cust["email"]
    
    res = client.get("/profile")
    assert res.status_code == 200
    html = res.data.decode("utf-8")
    assert cust["email"] in html
    assert "themeToggleBtn" in html

    # Test profile update
    update_res = client.post("/profile", data={
        "full_name": cust["full_name"],
        "email": cust["email"]
    }, follow_redirects=True)
    assert update_res.status_code == 200

def test_products_marketplace(client):
    """Test marketplace browse, search, and category filter"""
    res = client.get("/products")
    assert res.status_code == 200
    html = res.data.decode("utf-8")
    assert "Marketplace" in html or "Products" in html

    # Search keyword
    res_search = client.get("/products?search=pottery")
    assert res_search.status_code == 200

def test_product_detail_page(client):
    """Test product detail route"""
    conn = get_db_connection()
    product = conn.execute("SELECT id FROM products LIMIT 1").fetchone()
    conn.close()
    if product:
        pid = product["id"]
        res = client.get(f"/product/{pid}")
        assert res.status_code in [200, 302]

def test_cart_and_orders(client):
    """Test cart and orders view for logged-in user"""
    conn = get_db_connection()
    cust = conn.execute("SELECT id, full_name, email, role FROM users WHERE role = 'customer' LIMIT 1").fetchone()
    conn.close()

    with client.session_transaction() as sess:
        sess["user_id"] = cust["id"]
        sess["user_name"] = cust["full_name"]
        sess["user_role"] = "customer"
        sess["user_email"] = cust["email"]
    
    res_cart = client.get("/cart")
    assert res_cart.status_code in [200, 302]

    res_orders = client.get("/orders")
    assert res_orders.status_code in [200, 302]

def test_seller_dashboard_access_control(client):
    """Test that customer cannot access seller dashboard, but entrepreneur can"""
    conn = get_db_connection()
    cust = conn.execute("SELECT id, full_name, email, role FROM users WHERE role = 'customer' LIMIT 1").fetchone()
    ent = conn.execute("SELECT id, full_name, email, role FROM users WHERE role = 'entrepreneur' LIMIT 1").fetchone()
    conn.close()

    # Customer attempt -> redirected to /dashboard (302)
    with client.session_transaction() as sess:
        sess["user_id"] = cust["id"]
        sess["user_name"] = cust["full_name"]
        sess["user_role"] = "customer"
        sess["user_email"] = cust["email"]
    
    res_deny = client.get("/seller_dashboard")
    assert res_deny.status_code in [302, 403]

    # Entrepreneur attempt -> allowed (200)
    with client.session_transaction() as sess:
        sess["user_id"] = ent["id"]
        sess["user_name"] = ent["full_name"]
        sess["user_role"] = "entrepreneur"
        sess["user_email"] = ent["email"]
    
    res_allow = client.get("/seller_dashboard")
    assert res_allow.status_code == 200
    html = res_allow.data.decode("utf-8")
    assert "Dashboard" in html
    assert "themeToggleBtn" in html

def test_admin_dashboard_access_control(client):
    """Test that non-admin cannot access admin dashboard, but admin can"""
    conn = get_db_connection()
    cust = conn.execute("SELECT id, full_name, email, role FROM users WHERE role = 'customer' LIMIT 1").fetchone()
    admin = conn.execute("SELECT id, full_name, email, role FROM users WHERE role = 'admin' LIMIT 1").fetchone()
    conn.close()

    # Customer attempt -> redirected (302)
    with client.session_transaction() as sess:
        sess["user_id"] = cust["id"]
        sess["user_role"] = "customer"
    res_deny = client.get("/admin_dashboard")
    assert res_deny.status_code in [302, 403]

    # Admin attempt -> allowed (200)
    with client.session_transaction() as sess:
        sess["user_id"] = admin["id"]
        sess["user_name"] = admin["full_name"]
        sess["user_role"] = "admin"
        sess["user_email"] = admin["email"]
    res_admin = client.get("/admin_dashboard")
    assert res_admin.status_code == 200
    assert "Admin Dashboard" in res_admin.data.decode("utf-8")

def test_logout(client):
    """Test that logout clears session and redirects"""
    with client.session_transaction() as sess:
        sess["user_id"] = 22
        sess["user_role"] = "customer"
    
    res = client.get("/logout")
    assert res.status_code == 302
    with client.session_transaction() as sess:
        assert "user_id" not in sess
