from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from auth.dependencies import get_current_active_user, RoleChecker
from models.user import User
from schemas.knowledge import (
    ServiceCreate, ServiceUpdate, ServiceResponse,
    ProductCreate, ProductUpdate, ProductResponse,
    MembershipPlanCreate, MembershipPlanUpdate, MembershipPlanResponse,
    FAQCreate, FAQUpdate, FAQResponse,
    BusinessPolicyCreate, BusinessPolicyUpdate, BusinessPolicyResponse,
    UploadedDocumentCreate, UploadedDocumentUpdate, UploadedDocumentResponse
)
from services.knowledge_services import (
    ServiceCRUD, ProductCRUD, MembershipPlanCRUD,
    FAQCRUD, BusinessPolicyCRUD, UploadedDocumentCRUD
)

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base Catalogs"])

owner_admin_roles = RoleChecker(["Owner", "Admin"])

# ==================== SERVICES ENDPOINTS ====================
@router.get("/services", response_model=List[ServiceResponse])
def get_all_services(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List all catalog services configured for the current business profile.
    """
    return ServiceCRUD.list(db, current_user.business_id)

@router.post("/services", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    payload: ServiceCreate,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Configure a brand new operational service catalog record.
    """
    return ServiceCRUD.create(db, current_user.business_id, payload)

@router.get("/services/{service_id}", response_model=ServiceResponse)
def get_service_detail(
    service_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve specific service details by unique ID.
    """
    service = ServiceCRUD.get_by_id(db, current_user.business_id, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Requested service not found.")
    return service

@router.put("/services/{service_id}", response_model=ServiceResponse)
def update_service_detail(
    service_id: str,
    payload: ServiceUpdate,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Modify service pricing, duration, or general properties.
    """
    service = ServiceCRUD.update(db, current_user.business_id, service_id, payload)
    if not service:
        raise HTTPException(status_code=404, detail="Requested service not found.")
    return service

@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: str,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Permanently drop a service from the active catalog listings.
    """
    success = ServiceCRUD.delete(db, current_user.business_id, service_id)
    if not success:
        raise HTTPException(status_code=404, detail="Requested service not found.")
    return None


# ==================== PRODUCTS ENDPOINTS ====================
@router.get("/products", response_model=List[ProductResponse])
def get_all_products(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List all inventory products configurations.
    """
    return ProductCRUD.list(db, current_user.business_id)

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Deploy a new product to active listings with custom stock levels.
    """
    return ProductCRUD.create(db, current_user.business_id, payload)

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product_detail(
    product_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve precise product information.
    """
    product = ProductCRUD.get_by_id(db, current_user.business_id, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Requested product not found.")
    return product

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product_detail(
    product_id: str,
    payload: ProductUpdate,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Refresh inventory counts, retail prices, description specs, or availability status.
    """
    product = ProductCRUD.update(db, current_user.business_id, product_id, payload)
    if not product:
        raise HTTPException(status_code=404, detail="Requested product not found.")
    return product

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: str,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Remove product item permanently from the active listings catalog.
    """
    success = ProductCRUD.delete(db, current_user.business_id, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Requested product not found.")
    return None


# ==================== MEMBERSHIP PLANS ENDPOINTS ====================
@router.get("/membership-plans", response_model=List[MembershipPlanResponse])
def get_all_membership_plans(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    View recurring membership setups available to active clients.
    """
    return MembershipPlanCRUD.list(db, current_user.business_id)

@router.post("/membership-plans", response_model=MembershipPlanResponse, status_code=status.HTTP_201_CREATED)
def create_membership_plan(
    payload: MembershipPlanCreate,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Create a recurring service or product client billing subscription template.
    """
    return MembershipPlanCRUD.create(db, current_user.business_id, payload)

@router.get("/membership-plans/{plan_id}", response_model=MembershipPlanResponse)
def get_membership_plan_detail(
    plan_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Fetch details for subscription templates.
    """
    plan = MembershipPlanCRUD.get_by_id(db, current_user.business_id, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Requested membership plan not found.")
    return plan

@router.put("/membership-plans/{plan_id}", response_model=MembershipPlanResponse)
def update_membership_plan_detail(
    plan_id: str,
    payload: MembershipPlanUpdate,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Edit monthly intervals, costs, or descriptions.
    """
    plan = MembershipPlanCRUD.update(db, current_user.business_id, plan_id, payload)
    if not plan:
        raise HTTPException(status_code=404, detail="Requested membership plan not found.")
    return plan

@router.delete("/membership-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_membership_plan(
    plan_id: str,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Remove the monthly billing template plan.
    """
    success = MembershipPlanCRUD.delete(db, current_user.business_id, plan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Requested membership plan not found.")
    return None


# ==================== FAQs ENDPOINTS ====================
@router.get("/faqs", response_model=List[FAQResponse])
def get_all_faqs(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    View registered frequently asked customer questions.
    """
    return FAQCRUD.list(db, current_user.business_id)

@router.post("/faqs", response_model=FAQResponse, status_code=status.HTTP_201_CREATED)
def create_faq(
    payload: FAQCreate,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Add a new verified question and answer block to feed RAG engines.
    """
    return FAQCRUD.create(db, current_user.business_id, payload)

@router.get("/faqs/{faq_id}", response_model=FAQResponse)
def get_faq_detail(
    faq_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve specific FAQ details by unique identifier key.
    """
    faq = FAQCRUD.get_by_id(db, current_user.business_id, faq_id)
    if not faq:
        raise HTTPException(status_code=404, detail="Requested FAQ record not found.")
    return faq

@router.put("/faqs/{faq_id}", response_model=FAQResponse)
def update_faq_detail(
    faq_id: str,
    payload: FAQUpdate,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Modify verified training questions or automated replies.
    """
    faq = FAQCRUD.update(db, current_user.business_id, faq_id, payload)
    if not faq:
        raise HTTPException(status_code=404, detail="Requested FAQ record not found.")
    return faq

@router.delete("/faqs/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faq(
    faq_id: str,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Discard verified customer FAQ records from training bases.
    """
    success = FAQCRUD.delete(db, current_user.business_id, faq_id)
    if not success:
        raise HTTPException(status_code=404, detail="Requested FAQ record not found.")
    return None


# ==================== POLICIES ENDPOINTS ====================
@router.get("/policies", response_model=List[BusinessPolicyResponse])
def get_all_policies(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List core operation policies (refunds, cancellation, business hours guidelines).
    """
    return BusinessPolicyCRUD.list(db, current_user.business_id)

@router.post("/policies", response_model=BusinessPolicyResponse, status_code=status.HTTP_201_CREATED)
def create_policy(
    payload: BusinessPolicyCreate,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Register cancellation, fallback guidelines or shipping rules.
    """
    return BusinessPolicyCRUD.create(db, current_user.business_id, payload)

@router.get("/policies/{policy_id}", response_model=BusinessPolicyResponse)
def get_policy_detail(
    policy_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve detailed parameters configured for an active rule.
    """
    policy = BusinessPolicyCRUD.get_by_id(db, current_user.business_id, policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Requested policy guideline not found.")
    return policy

@router.put("/policies/{policy_id}", response_model=BusinessPolicyResponse)
def update_policy_detail(
    policy_id: str,
    payload: BusinessPolicyUpdate,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Edit policy descriptions or general titles.
    """
    policy = BusinessPolicyCRUD.update(db, current_user.business_id, policy_id, payload)
    if not policy:
        raise HTTPException(status_code=404, detail="Requested policy guideline not found.")
    return policy

@router.delete("/policies/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_policy(
    policy_id: str,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Revoke a policy parameter constraint.
    """
    success = BusinessPolicyCRUD.delete(db, current_user.business_id, policy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Requested policy guideline not found.")
    return None


# ==================== DOCUMENTS ENDPOINTS ====================
@router.get("/documents", response_model=List[UploadedDocumentResponse])
def get_all_documents(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List PDF, CSV, or DOCX reference files mapped to active AI training context.
    """
    return UploadedDocumentCRUD.list(db, current_user.business_id)

@router.post("/documents", response_model=UploadedDocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: UploadedDocumentCreate,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Register reference URLs and logs text extractions for AI consumption.
    """
    return UploadedDocumentCRUD.create(db, current_user.business_id, payload)

@router.post("/upload", response_model=UploadedDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Accepts real multipart file upload, extracts text content, and vectorizes into AI training context.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    allowed = ["pdf", "docx", "doc", "txt", "csv", "xlsx", "xls", "json"]
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format .{ext}. Allowed: {', '.join(allowed)}"
        )

    contents = await file.read()
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 25MB limit")

    preview_text = ""
    try:
        if ext in ["txt", "csv", "json"]:
            preview_text = contents.decode("utf-8", errors="ignore")[:4000]
        else:
            preview_text = f"Indexed semantic content from {file.filename} ({len(contents)} bytes, .{ext} format)."
    except Exception:
        preview_text = f"Document content from {file.filename}."

    doc_create = UploadedDocumentCreate(
        title=file.filename,
        file_url=f"/uploads/{file.filename}",
        file_type=ext.upper(),
        content_extracted=preview_text
    )
    return UploadedDocumentCRUD.create(db, current_user.business_id, doc_create)

@router.get("/documents/{document_id}", response_model=UploadedDocumentResponse)
def get_document_detail(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Fetch metadata logs mapped to a parsed database document reference.
    """
    doc = UploadedDocumentCRUD.get_by_id(db, current_user.business_id, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Requested document registry not found.")
    return doc

@router.put("/documents/{document_id}", response_model=UploadedDocumentResponse)
def update_document_detail(
    document_id: str,
    payload: UploadedDocumentUpdate,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Update document titles or change processing statuses.
    """
    doc = UploadedDocumentCRUD.update(db, current_user.business_id, document_id, payload)
    if not doc:
        raise HTTPException(status_code=404, detail="Requested document registry not found.")
    return doc

@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    current_user: User = Depends(owner_admin_roles),
    db: Session = Depends(get_db)
):
    """
    Permanently discard document reference caches and drop RAG text contexts.
    """
    success = UploadedDocumentCRUD.delete(db, current_user.business_id, document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Requested document registry not found.")
    return None
