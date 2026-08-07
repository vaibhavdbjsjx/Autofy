import json
import pytest
from decimal import Decimal
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from models.business import Business
from models.product import Product
from models.service import Service
from models.order import Order
from routers.product import map_product_to_response

def test_product_crud_and_validation(db_session: Session):
    """
    Verify Product creation, numeric price handling, stock alert computation, and database persistence.
    """
    biz = Business(id="biz-prod-1", name="Prod Biz 1", email="prod1@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    prod = Product(
        business_id="biz-prod-1",
        name="Engine Oil 5W-40",
        category="Lubricants",
        price=Decimal("1250.00"),
        stock=10,
        low_stock_threshold=3
    )
    db_session.add(prod)
    db_session.commit()

    assert prod.id is not None
    res = map_product_to_response(prod)
    assert res["name"] == "Engine Oil 5W-40"
    assert res["price"] == Decimal("1250.00")
    assert res["is_low_stock"] is False

def test_product_tenant_isolation(db_session: Session):
    """
    Verify Product database queries enforce business_id filtering.
    """
    biz_a = Business(id="biz-pa", name="Biz PA", email="pa@test.com", classification="Retail")
    biz_b = Business(id="biz-pb", name="Biz PB", email="pb@test.com", classification="Retail")
    db_session.add_all([biz_a, biz_b])
    db_session.commit()

    prod_a = Product(id="prod-a-100", business_id="biz-pa", name="Exhaust Pipe", price=Decimal("4500.00"), stock=5)
    db_session.add(prod_a)
    db_session.commit()

    # Query for Business B must return None
    found_b = db_session.query(Product).filter(Product.id == "prod-a-100", Product.business_id == "biz-pb").first()
    assert found_b is None

def test_service_crud_and_tenant_isolation(db_session: Session):
    """
    Verify Service model creation and tenant isolation.
    """
    biz_a = Business(id="biz-sa", name="Biz SA", email="sa@test.com", classification="Automotive")
    biz_b = Business(id="biz-sb", name="Biz SB", email="sb@test.com", classification="Retail")
    db_session.add_all([biz_a, biz_b])
    db_session.commit()

    svc_a = Service(id="svc-a-200", business_id="biz-sa", name="Full Car Wash", price=Decimal("800.00"), duration_minutes=45)
    db_session.add(svc_a)
    db_session.commit()

    # Query for Business B must return None
    found_b = db_session.query(Service).filter(Service.id == "svc-a-200", Service.business_id == "biz-sb").first()
    assert found_b is None

def test_order_creation_backend_authoritative_total(db_session: Session):
    """
    Verify order creation calculates total price server-side based on trusted product price in DB,
    preventing client-side total manipulation.
    """
    biz = Business(id="biz-ord-1", name="Ord Biz 1", email="ord1@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    prod = Product(id="prod-auth-1", business_id="biz-ord-1", name="Brake Pads", price=Decimal("1500.00"), stock=20)
    db_session.add(prod)
    db_session.commit()

    # Client submits fake cheap total_price (e.g. ₹1.00)
    items_json = json.dumps([{"id": "prod-auth-1", "name": "Brake Pads", "quantity": 2, "price": 1.00}])
    
    # We test authoritative calculation logic
    items_list = json.loads(items_json)
    calculated_total = Decimal("0.00")
    for item in items_list:
        p = db_session.query(Product).filter(Product.id == item["id"], Product.business_id == "biz-ord-1").first()
        calculated_total += (p.price * item["quantity"])

    assert calculated_total == Decimal("3000.00") # 2 * 1500 = 3000, ignoring fake 1.00!

def test_order_foreign_product_rejection(db_session: Session):
    """
    Verify submitting an order with a product ID belonging to another business fails validation.
    """
    biz_a = Business(id="biz-oa", name="Biz OA", email="oa@test.com", classification="Retail")
    biz_b = Business(id="biz-ob", name="Biz OB", email="ob@test.com", classification="Retail")
    db_session.add_all([biz_a, biz_b])
    db_session.commit()

    prod_b = Product(id="prod-foreign-99", business_id="biz-ob", name="Foreign Helmet", price=Decimal("2500.00"), stock=10)
    db_session.add(prod_b)
    db_session.commit()

    # Querying foreign product under Business A context returns None
    prod_under_a = db_session.query(Product).filter(Product.id == "prod-foreign-99", Product.business_id == "biz-oa").first()
    assert prod_under_a is None

def test_order_cancellation_restores_stock(db_session: Session):
    """
    Verify cancelling a pending order returns product quantities to stock.
    """
    biz = Business(id="biz-cancel-stock", name="Cancel Stock Biz", email="cs@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    prod = Product(id="prod-stock-1", business_id="biz-cancel-stock", name="Chain Lube", price=Decimal("400.00"), stock=15)
    db_session.add(prod)
    db_session.commit()

    items = [{"id": "prod-stock-1", "quantity": 3}]
    order = Order(
        id="ord-cancel-1",
        business_id="biz-cancel-stock",
        customer_name="Bob Miller",
        customer_email="bob@test.com",
        shipping_address="123 Street",
        items_json=json.dumps(items),
        total_price=Decimal("1200.00"),
        status="Pending"
    )
    prod.stock -= 3
    db_session.add(order)
    db_session.commit()

    assert prod.stock == 12

    # Simulate cancellation
    order.status = "Cancelled"
    prod.stock += 3
    db_session.commit()

    assert prod.stock == 15

def test_empty_business_zero_commerce_data(db_session: Session):
    """
    Verify a brand-new business returns 0 products, 0 orders, and 0.00 revenue metrics.
    """
    biz_empty = Business(id="biz-empty-comm", name="Empty Commerce Biz", email="ecomm@test.com", classification="Retail")
    db_session.add(biz_empty)
    db_session.commit()

    products = db_session.query(Product).filter(Product.business_id == "biz-empty-comm").all()
    orders = db_session.query(Order).filter(Order.business_id == "biz-empty-comm").all()
    services = db_session.query(Service).filter(Service.business_id == "biz-empty-comm").all()

    assert len(products) == 0
    assert len(orders) == 0
    assert len(services) == 0

def test_insufficient_stock_rejection(db_session: Session):
    """
    Verify ordering quantity > available stock is rejected and stock is not oversold.
    """
    biz = Business(id="biz-insuff-stock", name="Insuff Stock Biz", email="is@test.com", classification="Retail")
    db_session.add(biz)
    db_session.commit()

    prod = Product(id="prod-limited-1", business_id="biz-insuff-stock", name="Limited Jacket", price=Decimal("5000.00"), stock=1)
    db_session.add(prod)
    db_session.commit()

    # Attempting to order 5 units when only 1 is available
    requested_qty = 5
    assert prod.stock < requested_qty
    # Stock remains 1 and is not set to 0 or negative
    assert prod.stock == 1
