def add(client, category_id, amount, day, title="Item"):
    return client.post(
        "/api/expenses",
        json={"title": title, "amount": amount, "expense_date": day, "category_id": category_id},
    )


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_create_and_list_categories(client, food):
    assert food["name"] == "Food"
    assert client.get("/api/categories").json()[0]["id"] == food["id"]


def test_duplicate_category_is_rejected(client, food):
    r = client.post("/api/categories", json={"name": "food"})
    assert r.status_code == 409


def test_create_expense(client, food):
    r = add(client, food["id"], 12.5, "2025-03-10", "Lunch")
    assert r.status_code == 201
    body = r.json()
    assert body["amount"] == 12.5
    assert body["category"]["name"] == "Food"


def test_expense_validation(client, food):
    assert add(client, food["id"], -5, "2025-03-10").status_code == 422
    assert add(client, food["id"], 10.123, "2025-03-10").status_code == 422
    assert add(client, 999, 10, "2025-03-10").status_code == 404
    bad_date = client.post(
        "/api/expenses",
        json={"title": "x", "amount": 1, "expense_date": "not-a-date", "category_id": food["id"]},
    )
    assert bad_date.status_code == 422


def test_filter_by_month(client, food):
    add(client, food["id"], 10, "2025-03-31")
    add(client, food["id"], 20, "2025-04-01")
    march = client.get("/api/expenses", params={"year": 2025, "month": 3}).json()
    assert [e["amount"] for e in march] == [10]


def test_update_and_delete(client, food, travel):
    expense = add(client, food["id"], 10, "2025-03-10").json()
    r = client.patch(f"/api/expenses/{expense['id']}", json={"amount": 15, "category_id": travel["id"]})
    assert r.status_code == 200
    assert r.json()["amount"] == 15
    assert r.json()["category"]["name"] == "Travel"
    assert client.delete(f"/api/expenses/{expense['id']}").status_code == 204
    assert client.get(f"/api/expenses/{expense['id']}").status_code == 404


def test_monthly_summary(client, food, travel):
    add(client, food["id"], 10.10, "2025-03-02")
    add(client, food["id"], 20.20, "2025-03-15")
    add(client, travel["id"], 70, "2025-03-20")
    add(client, travel["id"], 999, "2025-04-01")  # different month, must be ignored

    r = client.get("/api/reports/monthly", params={"year": 2025, "month": 3})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 100.30
    assert body["count"] == 3
    assert [c["name"] for c in body["by_category"]] == ["Travel", "Food"]
    assert body["by_category"][0]["percentage"] == 69.8


def test_monthly_summary_empty_month(client):
    body = client.get("/api/reports/monthly", params={"year": 2025, "month": 1}).json()
    assert body["total"] == 0 and body["count"] == 0 and body["by_category"] == []


def test_monthly_summary_validates_month(client):
    assert client.get("/api/reports/monthly", params={"year": 2025, "month": 13}).status_code == 422


def test_yearly_summary(client, food):
    add(client, food["id"], 10, "2025-01-05")
    add(client, food["id"], 30, "2025-03-05")
    body = client.get("/api/reports/yearly", params={"year": 2025}).json()
    assert len(body["months"]) == 12
    assert body["months"][0]["total"] == 10
    assert body["months"][1]["total"] == 0
    assert body["total"] == 40


def test_cannot_delete_category_in_use(client, food):
    add(client, food["id"], 10, "2025-03-10")
    assert client.delete(f"/api/categories/{food['id']}").status_code == 409


def test_delete_unused_category(client, travel):
    assert client.delete(f"/api/categories/{travel['id']}").status_code == 204
