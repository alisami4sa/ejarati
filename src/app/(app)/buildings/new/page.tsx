import { BackButton } from "@/components/back-button";
import { BuildingForm } from "@/components/building-form";

export default function NewBuildingPage() {
  return (
    <>
      <div className="page-head">
        <div className="page-head-main">
          <BackButton href="/dashboard" label="رجوع للوحة" />
          <h1 className="page-title">إضافة عمارة</h1>
          <p className="page-sub">أنشئ عمارة ثم أضف شققها وعقودها</p>
        </div>
      </div>
      <BuildingForm />
    </>
  );
}
