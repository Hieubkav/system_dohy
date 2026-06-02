import { BadgeDollarSign, BookOpen, Code, FileText, GraduationCap, PlayCircle, Star, UserRound } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';

export const coursesModule = defineModuleWithRuntime({
  key: 'courses',
  name: 'Khóa học',
  description: 'Cấu hình khóa học, danh mục và curriculum',
  icon: GraduationCap,
  color: 'indigo',
  categoryModuleKey: 'courseCategories',

  features: [
    { key: 'enablePricing', label: 'Giá khóa học', icon: BadgeDollarSign, linkedField: 'priceAmount' },
    { key: 'enableInstructor', label: 'Giảng viên', icon: UserRound, linkedField: 'instructorName' },
    { key: 'enableLevel', label: 'Cấp độ', icon: BookOpen, linkedField: 'level' },
    { key: 'enableIntroVideo', label: 'Video giới thiệu', icon: PlayCircle, linkedField: 'introVideoUrl' },
    { key: 'enableFeatured', label: 'Nổi bật', icon: Star, linkedField: 'featured', enabled: false },
    { key: 'enableMarkdownRender', label: 'Markdown render', icon: FileText, linkedField: 'markdownRender', enabled: false },
    { key: 'enableHtmlRender', label: 'HTML render', icon: Code, linkedField: 'htmlRender', enabled: false },
  ],

  settings: [
    { key: 'coursesPerPage', label: 'Số khóa học / trang', type: 'number', default: 10 },
    {
      key: 'enableMultipleCategories',
      label: 'Cho phép nhiều danh mục',
      type: 'toggle',
      default: false,
    },
    {
      key: 'defaultStatus',
      label: 'Trạng thái mặc định',
      type: 'select',
      default: 'draft',
      options: [
        { value: 'draft', label: 'Bản nháp' },
        { value: 'published', label: 'Xuất bản' },
      ],
    },
    {
      key: 'defaultPricingType',
      label: 'Kiểu giá mặc định',
      type: 'select',
      default: 'free',
      options: [
        { value: 'free', label: 'Miễn phí' },
        { value: 'paid', label: 'Trả phí' },
        { value: 'contact', label: 'Liên hệ' },
      ],
    },
  ],

  conventionNote: 'Course dùng table riêng cho chapters/lessons; không nhét curriculum vào mảng trong document course.',

  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'title', isSystem: true, name: 'Tiêu đề', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'slug', isSystem: true, name: 'Slug', order: 1, required: true, type: 'text' },
      { enabled: true, fieldKey: 'content', isSystem: true, name: 'Nội dung', order: 2, required: true, type: 'richtext' },
      { enabled: true, fieldKey: 'order', isSystem: true, name: 'Thứ tự', order: 3, required: true, type: 'number' },
      { enabled: true, fieldKey: 'status', isSystem: true, name: 'Trạng thái', order: 4, required: true, type: 'select' },
      { enabled: true, fieldKey: 'excerpt', isSystem: false, name: 'Mô tả ngắn', order: 5, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'thumbnail', isSystem: false, name: 'Ảnh đại diện', order: 6, required: false, type: 'image' },
      { enabled: true, fieldKey: 'categoryId', isSystem: true, name: 'Danh mục', order: 7, required: true, type: 'select' },
      { enabled: true, fieldKey: 'pricingType', isSystem: false, linkedFeature: 'enablePricing', name: 'Kiểu giá', order: 8, required: true, type: 'select' },
      { enabled: true, fieldKey: 'priceAmount', isSystem: false, linkedFeature: 'enablePricing', name: 'Giá bán', order: 9, required: false, type: 'price' },
      { enabled: true, fieldKey: 'comparePriceAmount', isSystem: false, linkedFeature: 'enablePricing', name: 'Giá gạch', order: 10, required: false, type: 'price' },
      { enabled: true, fieldKey: 'priceNote', isSystem: false, linkedFeature: 'enablePricing', name: 'Ghi chú giá', order: 11, required: false, type: 'text' },
      { enabled: true, fieldKey: 'durationText', isSystem: false, name: 'Thời lượng hiển thị', order: 12, required: false, type: 'text' },
      { enabled: true, fieldKey: 'durationSeconds', isSystem: false, name: 'Thời lượng (giây)', order: 13, required: false, type: 'number' },
      { enabled: true, fieldKey: 'instructorName', isSystem: false, linkedFeature: 'enableInstructor', name: 'Giảng viên', order: 14, required: false, type: 'text' },
      { enabled: true, fieldKey: 'level', isSystem: false, linkedFeature: 'enableLevel', name: 'Cấp độ', order: 15, required: false, type: 'select' },
      { enabled: true, fieldKey: 'introVideoUrl', isSystem: false, linkedFeature: 'enableIntroVideo', name: 'Video giới thiệu', order: 16, required: false, type: 'text' },
      { enabled: false, fieldKey: 'featured', isSystem: false, linkedFeature: 'enableFeatured', name: 'Nổi bật', order: 17, required: false, type: 'boolean' },
      { enabled: true, fieldKey: 'metaTitle', group: 'seo', isSystem: false, name: 'Meta Title', order: 18, required: false, type: 'text' },
      { enabled: true, fieldKey: 'metaDescription', group: 'seo', isSystem: false, name: 'Meta Description', order: 19, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'renderType', isSystem: false, name: 'Kiểu render', order: 20, required: false, type: 'select' },
      { enabled: false, fieldKey: 'markdownRender', isSystem: false, linkedFeature: 'enableMarkdownRender', name: 'Markdown render', order: 21, required: false, type: 'textarea' },
      { enabled: false, fieldKey: 'htmlRender', isSystem: false, linkedFeature: 'enableHtmlRender', name: 'HTML render', order: 22, required: false, type: 'textarea' },
    ],
  },

  tabs: ['config'],
});
