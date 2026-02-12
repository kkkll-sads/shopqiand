import React from 'react'

interface ShopProductDescriptionSectionProps {
  sectionRef: React.RefObject<HTMLDivElement | null>
  description?: string
  detailImages: string[]
  mainImage: string
}

const ShopProductDescriptionSection: React.FC<ShopProductDescriptionSectionProps> = ({
  sectionRef,
  description,
  detailImages,
  mainImage,
}) => (
  <div className="bg-white mt-2" ref={sectionRef}>
    <div className="px-4 py-3 border-b border-gray-100">
      <span className="font-bold text-gray-800">商品介绍</span>
    </div>
    <div className="p-4">
      {description && (
        <div className="text-sm text-gray-600 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: description }} />
      )}

      <div className="space-y-0">
        {(detailImages.length > 0 ? detailImages : [mainImage]).filter(Boolean).map((img, idx) => (
          <img key={idx} src={img} alt={`详情图${idx + 1}`} className="w-full" loading="lazy" />
        ))}
      </div>
    </div>
  </div>
)

export default ShopProductDescriptionSection
