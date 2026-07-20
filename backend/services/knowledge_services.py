import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from models.service import Service
from models.product import Product
from models.membership_plan import MembershipPlan
from models.faq import FAQ
from models.business_policy import BusinessPolicy
from models.uploaded_document import UploadedDocument
from schemas.knowledge import (
    ServiceCreate, ServiceUpdate,
    ProductCreate, ProductUpdate,
    MembershipPlanCreate, MembershipPlanUpdate,
    FAQCreate, FAQUpdate,
    BusinessPolicyCreate, BusinessPolicyUpdate,
    UploadedDocumentCreate, UploadedDocumentUpdate
)

logger = logging.getLogger("autofy_catalog_services")

# ==================== SERVICE CRUD ====================
class ServiceCRUD:
    @staticmethod
    def create(db: Session, business_id: str, obj_in: ServiceCreate) -> Service:
        db_obj = Service(
            business_id=business_id,
            name=obj_in.name,
            price=obj_in.price,
            description=obj_in.description,
            duration_minutes=obj_in.duration_minutes
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, business_id: str, service_id: str) -> Optional[Service]:
        return db.query(Service).filter(
            Service.id == service_id, 
            Service.business_id == business_id
        ).first()

    @staticmethod
    def list(db: Session, business_id: str) -> List[Service]:
        return db.query(Service).filter(Service.business_id == business_id).all()

    @staticmethod
    def update(db: Session, business_id: str, service_id: str, obj_in: ServiceUpdate) -> Optional[Service]:
        db_obj = ServiceCRUD.get_by_id(db, business_id, service_id)
        if not db_obj:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, business_id: str, service_id: str) -> bool:
        db_obj = ServiceCRUD.get_by_id(db, business_id, service_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True


# ==================== PRODUCT CRUD ====================
class ProductCRUD:
    @staticmethod
    def create(db: Session, business_id: str, obj_in: ProductCreate) -> Product:
        db_obj = Product(
            business_id=business_id,
            name=obj_in.name,
            price=obj_in.price,
            stock=obj_in.stock,
            image_url=obj_in.image_url,
            description=obj_in.description,
            is_available=obj_in.is_available
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, business_id: str, product_id: str) -> Optional[Product]:
        return db.query(Product).filter(
            Product.id == product_id, 
            Product.business_id == business_id
        ).first()

    @staticmethod
    def list(db: Session, business_id: str) -> List[Product]:
        return db.query(Product).filter(Product.business_id == business_id).all()

    @staticmethod
    def update(db: Session, business_id: str, product_id: str, obj_in: ProductUpdate) -> Optional[Product]:
        db_obj = ProductCRUD.get_by_id(db, business_id, product_id)
        if not db_obj:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, business_id: str, product_id: str) -> bool:
        db_obj = ProductCRUD.get_by_id(db, business_id, product_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True


# ==================== MEMBERSHIP PLAN CRUD ====================
class MembershipPlanCRUD:
    @staticmethod
    def create(db: Session, business_id: str, obj_in: MembershipPlanCreate) -> MembershipPlan:
        db_obj = MembershipPlan(
            business_id=business_id,
            name=obj_in.name,
            price=obj_in.price,
            duration_months=obj_in.duration_months,
            description=obj_in.description
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, business_id: str, plan_id: str) -> Optional[MembershipPlan]:
        return db.query(MembershipPlan).filter(
            MembershipPlan.id == plan_id, 
            MembershipPlan.business_id == business_id
        ).first()

    @staticmethod
    def list(db: Session, business_id: str) -> List[MembershipPlan]:
        return db.query(MembershipPlan).filter(MembershipPlan.business_id == business_id).all()

    @staticmethod
    def update(db: Session, business_id: str, plan_id: str, obj_in: MembershipPlanUpdate) -> Optional[MembershipPlan]:
        db_obj = MembershipPlanCRUD.get_by_id(db, business_id, plan_id)
        if not db_obj:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, business_id: str, plan_id: str) -> bool:
        db_obj = MembershipPlanCRUD.get_by_id(db, business_id, plan_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True


# ==================== FAQ CRUD ====================
class FAQCRUD:
    @staticmethod
    def create(db: Session, business_id: str, obj_in: FAQCreate) -> FAQ:
        db_obj = FAQ(
            business_id=business_id,
            question=obj_in.question,
            answer=obj_in.answer
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, business_id: str, faq_id: str) -> Optional[FAQ]:
        return db.query(FAQ).filter(
            FAQ.id == faq_id, 
            FAQ.business_id == business_id
        ).first()

    @staticmethod
    def list(db: Session, business_id: str) -> List[FAQ]:
        return db.query(FAQ).filter(FAQ.business_id == business_id).all()

    @staticmethod
    def update(db: Session, business_id: str, faq_id: str, obj_in: FAQUpdate) -> Optional[FAQ]:
        db_obj = FAQCRUD.get_by_id(db, business_id, faq_id)
        if not db_obj:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, business_id: str, faq_id: str) -> bool:
        db_obj = FAQCRUD.get_by_id(db, business_id, faq_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True


# ==================== POLICY CRUD ====================
class BusinessPolicyCRUD:
    @staticmethod
    def create(db: Session, business_id: str, obj_in: BusinessPolicyCreate) -> BusinessPolicy:
        db_obj = BusinessPolicy(
            business_id=business_id,
            policy_type=obj_in.policy_type,
            title=obj_in.title,
            content=obj_in.content
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, business_id: str, policy_id: str) -> Optional[BusinessPolicy]:
        return db.query(BusinessPolicy).filter(
            BusinessPolicy.id == policy_id, 
            BusinessPolicy.business_id == business_id
        ).first()

    @staticmethod
    def list(db: Session, business_id: str) -> List[BusinessPolicy]:
        return db.query(BusinessPolicy).filter(BusinessPolicy.business_id == business_id).all()

    @staticmethod
    def update(db: Session, business_id: str, policy_id: str, obj_in: BusinessPolicyUpdate) -> Optional[BusinessPolicy]:
        db_obj = BusinessPolicyCRUD.get_by_id(db, business_id, policy_id)
        if not db_obj:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, business_id: str, policy_id: str) -> bool:
        db_obj = BusinessPolicyCRUD.get_by_id(db, business_id, policy_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True


# ==================== DOCUMENT CRUD ====================
class UploadedDocumentCRUD:
    @staticmethod
    def create(db: Session, business_id: str, obj_in: UploadedDocumentCreate) -> UploadedDocument:
        db_obj = UploadedDocument(
            business_id=business_id,
            title=obj_in.title,
            file_url=obj_in.file_url,
            file_type=obj_in.file_type,
            content_extracted=obj_in.content_extracted,
            status="processed"
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_by_id(db: Session, business_id: str, document_id: str) -> Optional[UploadedDocument]:
        return db.query(UploadedDocument).filter(
            UploadedDocument.id == document_id, 
            UploadedDocument.business_id == business_id
        ).first()

    @staticmethod
    def list(db: Session, business_id: str) -> List[UploadedDocument]:
        return db.query(UploadedDocument).filter(UploadedDocument.business_id == business_id).all()

    @staticmethod
    def update(db: Session, business_id: str, document_id: str, obj_in: UploadedDocumentUpdate) -> Optional[UploadedDocument]:
        db_obj = UploadedDocumentCRUD.get_by_id(db, business_id, document_id)
        if not db_obj:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, business_id: str, document_id: str) -> bool:
        db_obj = UploadedDocumentCRUD.get_by_id(db, business_id, document_id)
        if not db_obj:
            return False
        db.delete(db_obj)
        db.commit()
        return True
