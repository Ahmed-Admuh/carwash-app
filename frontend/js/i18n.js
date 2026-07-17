// i18n.js — shared across all pages.
// Usage: include this script on any page (after auth.js). Mark translatable
// text with data-i18n="key" (sets textContent) or data-i18n-placeholder="key"
// (sets the placeholder attribute). A language toggle button is injected
// into the appbar automatically — no markup changes needed per page.

const I18N_LANG_KEY = "cwf_lang";

const I18N_DICT = {
  // ---- Navigation / chrome (appears on almost every page) ----
  nav_home: { en: "Home", ar: "الرئيسية" },
  nav_search: { en: "Search", ar: "بحث" },
  nav_about: { en: "About", ar: "حول" },
  nav_profile: { en: "Profile", ar: "حسابي" },
  nav_saved: { en: "Saved", ar: "المحفوظات" },
  footer_rights: { en: "© 2025 Car Wash Finder. All rights reserved.", ar: "© 2025 Car Wash Finder. جميع الحقوق محفوظة." },
  footer_payment: { en: "Payment Methods Accepted", ar: "طرق الدفع المقبولة" },

  // ---- Common actions ----
  btn_book_wash: { en: "Book a Wash", ar: "احجز غسيل" },
  btn_order_history: { en: "Order History", ar: "سجل الطلبات" },
  btn_log_in: { en: "Log In", ar: "تسجيل الدخول" },
  link_log_in: { en: "Log in", ar: "تسجيل الدخول" },
  btn_log_out: { en: "Log Out", ar: "تسجيل الخروج" },
  btn_create_account: { en: "Create Account", ar: "إنشاء حساب" },
  link_sign_up: { en: "Sign up", ar: "إنشاء حساب" },
  btn_add_vehicle: { en: "Add Vehicle", ar: "إضافة مركبة" },
  btn_add_payment: { en: "Add Payment Method", ar: "إضافة وسيلة دفع" },
  btn_book_this_wash: { en: "Book This Wash", ar: "احجز هذا الغسيل" },
  btn_back: { en: "Back", ar: "رجوع" },

  // ---- Home page ----
  home_eyebrow: { en: "Book in under a minute", ar: "احجز في أقل من دقيقة" },
  home_hero_title: { en: "Find a trusted car wash near you", ar: "ابحث عن غسيل سيارات موثوق بالقرب منك" },
  home_services_title: { en: "Services", ar: "الخدمات" },
  home_we_come_to_you: { en: "We Come To You", ar: "نأتي إليك" },
  home_offers_title: { en: "Offers & Discounts", ar: "العروض والخصومات" },
  home_packages_title: { en: "Packages", ar: "الباقات" },
  home_popular_title: { en: "Popular Car Washes", ar: "أشهر غسيلات السيارات" },

  // ---- Login / Signup ----
  auth_welcome_back: { en: "Welcome back", ar: "مرحبًا بعودتك" },
  auth_login_subtitle: { en: "Log in to book, track, and manage your washes.", ar: "سجّل الدخول لحجز ومتابعة وإدارة عمليات الغسيل." },
  auth_create_account: { en: "Create your account", ar: "أنشئ حسابك" },
  auth_signup_subtitle: { en: "Save vehicles, payment methods, and booking history.", ar: "احفظ مركباتك ووسائل الدفع وسجل الحجوزات." },
  auth_customer: { en: "Customer", ar: "عميل" },
  auth_wash_owner: { en: "Wash Owner", ar: "صاحب مغسلة" },
  auth_email: { en: "Email", ar: "البريد الإلكتروني" },
  auth_password: { en: "Password", ar: "كلمة المرور" },
  auth_full_name: { en: "Full name", ar: "الاسم الكامل" },
  auth_no_account: { en: "Don't have an account?", ar: "ليس لديك حساب؟" },
  auth_have_account: { en: "Already have an account?", ar: "لديك حساب بالفعل؟" },

  // ---- Profile ----
  profile_title: { en: "My Profile", ar: "حسابي" },
  profile_points_title: { en: "Points & Rewards", ar: "النقاط والمكافآت" },
  profile_history_title: { en: "Booking History", ar: "سجل الحجوزات" },
  profile_payment_title: { en: "Payment Methods", ar: "وسائل الدفع" },
  profile_vehicles_title: { en: "My Vehicles", ar: "مركباتي" },
  profile_bookings_stat: { en: "Bookings", ar: "الحجوزات" },
  profile_vehicles_stat: { en: "Vehicles", ar: "المركبات" },
  profile_payments_stat: { en: "Payments", ar: "وسائل الدفع" },

  // ---- Book page ----
  book_title: { en: "Book a Wash", ar: "احجز غسيلًا" },
  book_all: { en: "All", ar: "الكل" },
  book_locations: { en: "Car Wash Locations", ar: "مواقع غسيل السيارات" },
  book_mobile: { en: "Mobile / Home Service", ar: "خدمة متنقلة / منزلية" },
  book_moto: { en: "Moto-Mobile Wash", ar: "غسيل بالدراجة النارية" },
  book_sort_by: { en: "Sort By", ar: "ترتيب حسب" },

  // ---- About ----
  about_title: { en: "About Us", ar: "من نحن" },
  about_this_wash: { en: "About This Wash", ar: "عن هذا الغسيل" },

  // ---- Misc ----
  rate_this_wash: { en: "Rate this wash", ar: "قيّم هذا الغسيل" },
  cancel_booking: { en: "Cancel booking", ar: "إلغاء الحجز" },

  // ---- Booking details page ----
  booking_title: { en: "Complete Your Booking", ar: "أكمل حجزك" },
  step_1: { en: "Step 1", ar: "الخطوة 1" },
  step_2: { en: "Step 2", ar: "الخطوة 2" },
  step_3: { en: "Step 3 (Optional)", ar: "الخطوة 3 (اختياري)" },
  step_4: { en: "Step 4", ar: "الخطوة 4" },
  heading_your_vehicle: { en: "Your Vehicle", ar: "مركبتك" },
  heading_choose_wash: { en: "Choose Your Wash", ar: "اختر نوع الغسيل" },
  heading_add_extras: { en: "Add Extras", ar: "إضافات" },
  heading_date_time: { en: "Date & Time", ar: "التاريخ والوقت" },
  booking_step_payment: { en: "Payment Method", ar: "طريقة الدفع" },
  booking_special_requests: { en: "Special Requests (Optional)", ar: "طلبات خاصة (اختياري)" },
  booking_confirm_btn: { en: "Confirm Booking", ar: "تأكيد الحجز" },
  booking_total: { en: "Total:", ar: "الإجمالي:" },
  booking_where_come: { en: "Where should we come?", ar: "إلى أين نأتي؟" },
  booking_date_label: { en: "Date", ar: "التاريخ" },

  // ---- Booking confirmation page ----
  confirmation_title: { en: "Booking Confirmed!", ar: "تم تأكيد الحجز!" },
  confirmation_title_short: { en: "Booking Confirmation", ar: "تأكيد الحجز" },
  confirmation_subtitle: { en: "Your appointment has been saved and is ready to go.", ar: "تم حفظ موعدك وهو جاهز الآن." },
  confirmation_back_home: { en: "Back to Home", ar: "العودة للرئيسية" },
  confirmation_details_title: { en: "Booking Details", ar: "تفاصيل الحجز" },

  // ---- Seller dashboard ----
  seller_dashboard_title: { en: "Seller Dashboard", ar: "لوحة تحكم البائع" },
  seller_welcome: { en: "Welcome back", ar: "مرحبًا بعودتك" },
  seller_today_bookings: { en: "Today's Bookings", ar: "حجوزات اليوم" },
  seller_revenue: { en: "Revenue (30 days)", ar: "الإيرادات (30 يومًا)" },
  seller_upcoming: { en: "Upcoming", ar: "القادمة" },
  seller_completed: { en: "Completed", ar: "المكتملة" },
  seller_your_washes: { en: "Your Wash Places", ar: "أماكن الغسيل الخاصة بك" },
  seller_bookings_title: { en: "Bookings", ar: "الحجوزات" },

  // ---- Rate wash page ----
  rate_title: { en: "Rate Your Wash", ar: "قيّم عملية الغسيل" },
  rate_how_was_it: { en: "How was your wash?", ar: "كيف كانت عملية الغسيل؟" },
  rate_submit: { en: "Submit Rating", ar: "إرسال التقييم" },
  rate_already: { en: "You already rated this wash", ar: "لقد قيّمت هذا الغسيل من قبل" },
  rate_back_profile: { en: "Back to Profile", ar: "العودة للحساب" },

  // ---- Wash about page ----
  wash_about_about: { en: "About", ar: "نبذة" },
  wash_about_reviews: { en: "Reviews", ar: "التقييمات" },
  wash_about_book_this: { en: "Book This Wash", ar: "احجز هذا الغسيل" },
  wash_about_ratings_count: { en: "ratings on Car Wash Finder", ar: "تقييمًا على Car Wash Finder" },
  wash_about_no_reviews: { en: "No reviews yet — be the first!", ar: "لا توجد تقييمات بعد — كن أول من يقيّم!" },
  wash_about_no_wash_specified: { en: "No wash specified.", ar: "لم يتم تحديد غسيل." },
  wash_about_points_earned: { en: "Points per 1 SAR spent", ar: "نقاط لكل ريال يُنفق" },
  wash_about_typical_wait: { en: "Typical wait", ar: "متوسط الانتظار" },
  wash_about_typical_eta: { en: "Typical ETA", ar: "متوسط وقت الوصول" },
  wash_desc_location: { en: "Drive to this location for your wash.", ar: "توجّه إلى هذا الموقع لغسيل سيارتك." },
  wash_desc_home: { en: "A van with its own water tank and generator comes to your address.", ar: "تأتي شاحنة مزوّدة بخزان مياه ومولّد كهرباء خاص بها إلى عنوانك." },
  wash_desc_moto: { en: "A motorcycle fitted with a water tank comes to your address — nimble, fast, and great for tight streets. Best suited to sedans and SUVs.", ar: "تأتي دراجة نارية مزوّدة بخزان مياه إلى عنوانك — سريعة وخفيفة الحركة ومناسبة للشوارع الضيقة. الأنسب للسيارات الصغيرة وسيارات الدفع الرباعي." },
  type_label_location: { en: "Fixed Location", ar: "موقع ثابت" },
  type_label_home: { en: "Home Service (Van)", ar: "خدمة منزلية (شاحنة)" },
  type_label_moto: { en: "Moto-Mobile Wash", ar: "غسيل بالدراجة النارية" },

  // ---- Vehicle types ----
  vehicle_sedan: { en: "Sedan", ar: "سيدان" },
  vehicle_suv: { en: "SUV", ar: "دفع رباعي" },
  vehicle_truck: { en: "Truck", ar: "شاحنة صغيرة" },
  vehicle_van: { en: "Van", ar: "فان" },

  // ---- Book page dynamic ----
  book_loading: { en: "Loading…", ar: "جارٍ التحميل…" },
  book_available_options: { en: "Available Options", ar: "الخيارات المتاحة" },
  book_sort_distance: { en: "Distance", ar: "المسافة" },
  book_sort_price: { en: "Price", ar: "السعر" },
  book_sort_rating: { en: "Rating", ar: "التقييم" },
  book_open_now: { en: "Open Now", ar: "مفتوح الآن" },
  book_book_now: { en: "Book Now", ar: "احجز الآن" },
  book_min_wait: { en: "min wait", ar: "دقيقة انتظار" },
  book_min_eta: { en: "min ETA", ar: "دقيقة وقت الوصول" },
  book_no_results: { en: "No results match these filters.", ar: "لا توجد نتائج مطابقة لهذه الفلاتر." },
  book_comes_to_you: { en: "Comes to you", ar: "يأتي إليك" },
  book_from: { en: "From", ar: "يبدأ من" },
  result_word: { en: "results", ar: "نتيجة" },
  result_word_singular: { en: "result", ar: "نتيجة" },

  // ---- Booking details dynamic ----
  bd_included: { en: "Included", ar: "مشمول" },
  bd_exterior_only: { en: "Exterior Only", ar: "خارجي فقط" },
  bd_exterior_interior: { en: "Exterior + Interior", ar: "خارجي وداخلي" },
  bd_no_addons: { en: "No extras available for this wash.", ar: "لا توجد إضافات متاحة لهذا الغسيل." },
  bd_select_date_first: { en: "Select a date to see available times.", ar: "اختر تاريخًا لعرض الأوقات المتاحة." },
  bd_no_slots: { en: "No available times on this date — try another day.", ar: "لا توجد أوقات متاحة في هذا التاريخ — جرّب يومًا آخر." },
  bd_spots_left: { en: "spots left", ar: "مواعيد متبقية" },
  bd_full: { en: "Full", ar: "مكتمل" },
  bd_add_payment_first: { en: "Add a payment method in your profile first.", ar: "أضف وسيلة دفع في حسابك أولاً." },
  bd_not_found_title: { en: "Car Wash Not Found", ar: "لم يتم العثور على الغسيل" },
  bd_not_found_body: { en: "We couldn't find the wash you selected.", ar: "لم نتمكن من العثور على الغسيل الذي اخترته." },
  bd_back_to_washes: { en: "Back to Car Washes", ar: "العودة إلى غسيلات السيارات" },

  // ---- Booking confirmation dynamic ----
  bc_label_carwash: { en: "Car Wash", ar: "غسيل السيارات" },
  bc_label_washtype: { en: "Wash Type", ar: "نوع الغسيل" },
  bc_label_address: { en: "Address", ar: "العنوان" },
  bc_label_date: { en: "Date", ar: "التاريخ" },
  bc_label_time: { en: "Time", ar: "الوقت" },
  bc_label_addons: { en: "Add-ons", ar: "الإضافات" },
  bc_label_status: { en: "Status", ar: "الحالة" },
  bc_label_total: { en: "Total", ar: "الإجمالي" },
  bc_view_history: { en: "View Order History", ar: "عرض سجل الطلبات" },
  bc_none: { en: "None", ar: "لا يوجد" },
  bc_show_code: { en: "Show this code at the car wash, or to the technician if it's a home visit", ar: "أظهر هذا الرمز عند الغسيل، أو للفني في حال الزيارة المنزلية" },
  bc_booking_id: { en: "Booking ID", ar: "رقم الحجز" },
  bc_status_confirmed: { en: "confirmed", ar: "مؤكد" },
  bc_status_completed: { en: "completed", ar: "مكتمل" },
  bc_status_cancelled: { en: "cancelled", ar: "ملغى" },
  bc_label_payment_status: { en: "Payment", ar: "الدفع" },
  bc_payment_paid: { en: "Paid", ar: "مدفوع" },
  bc_payment_unpaid: { en: "Unpaid (pay on arrival)", ar: "غير مدفوع (يُدفع عند الوصول)" },
  bc_payment_refunded: { en: "Refunded", ar: "مسترد" },

  // ---- Profile dynamic ----
  profile_no_bookings: { en: "No bookings yet — go book your first wash!", ar: "لا توجد حجوزات بعد — احجز أول غسيل لك!" },
  profile_no_payments: { en: "No payment methods saved yet.", ar: "لا توجد وسائل دفع محفوظة بعد." },
  profile_no_vehicles: { en: "No vehicles saved yet.", ar: "لا توجد مركبات محفوظة بعد." },
  profile_default_badge: { en: "Default", ar: "افتراضي" },
  profile_set_default: { en: "Set as Default", ar: "تعيين كافتراضي" },
  profile_default_updated: { en: "Default payment method updated.", ar: "تم تحديث وسيلة الدفع الافتراضية." },
  profile_points_to_next: { en: "points to", ar: "نقطة للوصول إلى" },
  profile_all_unlocked: { en: "You've unlocked every reward tier!", ar: "لقد فتحت جميع مستويات المكافآت!" },
  profile_redeem: { en: "Redeem", ar: "استبدال" },
  profile_locked: { en: "Locked", ar: "مقفل" },
  profile_points_suffix: { en: "points", ar: "نقطة" },
  profile_pts_short: { en: "pts", ar: "نقطة" },

  // ---- Add Vehicle modal ----
  modal_add_vehicle_title: { en: "Add a Vehicle", ar: "إضافة مركبة" },
  modal_nickname: { en: "Nickname (optional)", ar: "اسم مستعار (اختياري)" },
  modal_make: { en: "Make", ar: "الشركة المصنعة" },
  modal_model: { en: "Model", ar: "الطراز" },
  modal_plate: { en: "License plate (optional)", ar: "رقم اللوحة (اختياري)" },
  modal_vehicle_type: { en: "Vehicle type", ar: "نوع المركبة" },

  // ---- Add Payment modal ----
  modal_add_payment_title: { en: "Add Payment Method", ar: "إضافة وسيلة دفع" },
  modal_last4: { en: "Last 4 digits of card", ar: "آخر 4 أرقام من البطاقة" },
  modal_set_default: { en: "Set as default", ar: "تعيين كوسيلة افتراضية" },

  // ---- About page ----
  about_hero_tagline: { en: "Connecting drivers with trusted car washes — at a shop, at your home, or wherever you're parked.", ar: "نربط السائقين بمغاسل سيارات موثوقة — في المحل أو في المنزل أو أينما ركنت سيارتك." },
  about_mission_title: { en: "Our Mission", ar: "مهمتنا" },
  about_mission_body: { en: "Getting your car washed shouldn't mean driving across town or waiting in line. Car Wash Finder brings together fixed-location car washes, mobile vans that come to your driveway, and water-tank motorcycles that can reach you even down the tightest streets — all bookable in a few taps, with transparent pricing up front.", ar: "غسيل سيارتك لا يجب أن يعني القيادة عبر المدينة أو الانتظار في طابور. يجمع Car Wash Finder بين مغاسل السيارات الثابتة والشاحنات المتنقلة التي تأتي إلى منزلك والدراجات النارية المزوّدة بخزانات مياه التي تصل إليك حتى في أضيق الشوارع — كل ذلك بضغطات قليلة وبأسعار واضحة من البداية." },
  about_stat_partners: { en: "Wash Partners", ar: "شركاء الغسيل" },
  about_stat_types: { en: "Service Types", ar: "أنواع الخدمة" },
  about_stat_slot: { en: "Fastest Slot", ar: "أسرع موعد" },
  about_values_title: { en: "What We Value", ar: "ما نؤمن به" },
  about_value_convenience_title: { en: "Convenience", ar: "الراحة" },
  about_value_convenience_body: { en: "Book in under a minute, from wherever you are.", ar: "احجز في أقل من دقيقة، أينما كنت." },
  about_value_pricing_title: { en: "Transparent Pricing", ar: "أسعار شفافة" },
  about_value_pricing_body: { en: "See the full price before you book — no surprises.", ar: "اطّلع على السعر الكامل قبل الحجز — بلا مفاجآت." },
  about_value_local_title: { en: "Local Businesses", ar: "أعمال محلية" },
  about_value_local_body: { en: "Every wash on the app is an independent local operator.", ar: "كل غسيل على التطبيق هو عمل محلي مستقل." },
  about_value_loyalty_title: { en: "Loyalty That Pays", ar: "ولاء يستحق العناء" },
  about_value_loyalty_body: { en: "Earn points on every wash, redeemable for free services.", ar: "اكسب نقاطًا مع كل غسيل، قابلة للاستبدال بخدمات مجانية." },
  about_contact_title: { en: "Get in Touch", ar: "تواصل معنا" },
  about_contact_list: { en: "Own a car wash, van, or motorcycle wash service?", ar: "هل تملك مغسلة سيارات أو شاحنة أو خدمة غسيل بالدراجة النارية؟" },
  about_contact_list_here: { en: "List it here", ar: "أضفها هنا" },

  // ---- Seller dashboard table ----
  seller_col_customer: { en: "Customer", ar: "العميل" },
  seller_col_wash: { en: "Wash", ar: "الغسيل" },
  seller_col_date: { en: "Date", ar: "التاريخ" },
  seller_col_time: { en: "Time", ar: "الوقت" },
  seller_col_type: { en: "Type", ar: "النوع" },
  seller_col_total: { en: "Total", ar: "الإجمالي" },
  seller_col_status: { en: "Status", ar: "الحالة" },
  seller_complete_btn: { en: "Complete", ar: "إتمام" },
  seller_cancel_btn: { en: "Cancel", ar: "إلغاء" },
  seller_no_bookings: { en: "No bookings yet.", ar: "لا توجد حجوزات بعد." },
  seller_no_washes: { en: "No wash places yet.", ar: "لا توجد أماكن غسيل بعد." },
  seller_pts_per_visit: { en: "pts/visit", ar: "نقطة/زيارة" },
  seller_base: { en: "base", ar: "أساسي" },
  seller_marked_complete: { en: "Marked complete — points awarded to customer.", ar: "تم وضع علامة مكتمل — تم منح النقاط للعميل." },
  seller_status_pending: { en: "pending", ar: "قيد الانتظار" },
  seller_col_payment: { en: "Payment", ar: "الدفع" },
  seller_accept_btn: { en: "Accept", ar: "قبول" },
  seller_decline_btn: { en: "Decline", ar: "رفض" },
  seller_decline_reason_prompt: { en: "Let the customer know why (optional):", ar: "أخبر العميل بالسبب (اختياري):" },
  seller_accepted: { en: "Booking accepted.", ar: "تم قبول الحجز." },
  seller_declined: { en: "Booking declined.", ar: "تم رفض الحجز." },
  seller_pts_rate: { en: "pts rate", ar: "معدل النقاط" },
  seller_add_wash: { en: "Add Wash Place", ar: "إضافة مكان غسيل" },
  seller_open_now: { en: "Open", ar: "مفتوح" },
  seller_closed_now: { en: "Closed", ar: "مغلق" },
  seller_wash_added: { en: "Wash place added.", ar: "تمت إضافة مكان الغسيل." },
  seller_edit_wash: { en: "Edit Settings", ar: "تعديل الإعدادات" },
  seller_view_slots: { en: "View Time Slots", ar: "عرض المواعيد" },
  seller_cash_only_badge: { en: "Cash Only", ar: "نقدًا فقط" },
  seller_wash_updated: { en: "Wash settings updated.", ar: "تم تحديث إعدادات الغسيل." },
  seller_pick_date: { en: "Pick a date", ar: "اختر تاريخًا" },
  seller_slots_legend: { en: "Green = fully open, amber = partially booked, red = fully booked.", ar: "أخضر = متاح بالكامل، كهرماني = محجوز جزئيًا، أحمر = محجوز بالكامل." },
  seller_save_changes: { en: "Save Changes", ar: "حفظ التغييرات" },
  seller_show_overview: { en: "Show 30-Day Overview", ar: "عرض ملخص 30 يومًا" },
  seller_revenue_day: { en: "Revenue this day", ar: "إيرادات هذا اليوم" },

  // ---- Demo mode ----
  demo_try_title: { en: "Try it instantly — no server needed", ar: "جرّبه فورًا — بدون الحاجة لخادم" },
  demo_try_customer: { en: "Explore as Customer", ar: "استكشف كعميل" },
  demo_try_seller: { en: "Explore as Wash Owner", ar: "استكشف كصاحب مغسلة" },
  demo_try_caption: { en: "Runs entirely in your browser — no backend, no database. Changes aren't saved anywhere beyond this browser.", ar: "يعمل بالكامل داخل متصفحك — بدون خادم أو قاعدة بيانات. التغييرات لا تُحفظ إلا في هذا المتصفح." },
  demo_or_login: { en: "or log in with a real account", ar: "أو سجّل الدخول بحساب حقيقي" },
  demo_hint_prefix: { en: "Demo login (needs the backend running):", ar: "تسجيل دخول تجريبي (يتطلب تشغيل الخادم):" },
  demo_seller_signin_title: { en: "Wash owner sign in", ar: "تسجيل دخول صاحب المغسلة" },
  demo_seller_signin_subtitle: { en: "Manage your bookings, pricing, and customers.", ar: "أدر حجوزاتك وأسعارك وعملاءك." },
  demo_banner_text: { en: "Demo mode — no server or database, changes only saved in this browser", ar: "وضع تجريبي — بدون خادم أو قاعدة بيانات، التغييرات محفوظة في هذا المتصفح فقط" },
  demo_exit: { en: "Exit demo", ar: "إنهاء الوضع التجريبي" },

  // ---- Login/signup validation (client-side) ----
  val_invalid_email: { en: "That doesn't look like a valid email address.", ar: "لا يبدو هذا بريدًا إلكترونيًا صالحًا." },
  val_enter_email: { en: "Please enter your email.", ar: "يرجى إدخال بريدك الإلكتروني." },
  val_enter_password: { en: "Please enter your password.", ar: "يرجى إدخال كلمة المرور." },
  val_enter_password_signup: { en: "Please enter a password.", ar: "يرجى إدخال كلمة مرور." },
  val_password_length: { en: "Password must be at least 6 characters.", ar: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل." },
  val_enter_name: { en: "Please enter your name.", ar: "يرجى إدخال اسمك." },
  val_enter_business_name: { en: "Please enter your business name.", ar: "يرجى إدخال اسم نشاطك التجاري." },
  auth_email_placeholder: { en: "you@example.com", ar: "you@example.com" },
  auth_password_placeholder: { en: "••••••••", ar: "••••••••" },
  auth_password_placeholder_signup: { en: "At least 6 characters", ar: "6 أحرف على الأقل" },
  auth_name_placeholder: { en: "Jane Smith", ar: "اسمك الكامل" },

  // ---- Business signup fields ----
  biz_section_title: { en: "Your wash business", ar: "نشاطك التجاري للغسيل" },
  biz_name_label: { en: "Business name", ar: "اسم النشاط التجاري" },
  biz_service_type_label: { en: "Service type", ar: "نوع الخدمة" },
  biz_location_label: { en: "Location / area", ar: "الموقع / المنطقة" },
  biz_hint: { en: "You can fine-tune your pricing, add-ons, and details afterward from your seller dashboard.", ar: "يمكنك ضبط الأسعار والإضافات والتفاصيل لاحقًا من لوحة تحكم البائع الخاصة بك." },
  biz_opt_location: { en: "Fixed location — customers drive to you", ar: "موقع ثابت — يأتي إليك العملاء" },
  biz_opt_home: { en: "Home service — a van comes to them", ar: "خدمة منزلية — تأتيهم شاحنة" },
  biz_opt_moto: { en: "Moto-mobile — a water-tank motorcycle comes to them", ar: "متنقل بالدراجة النارية — تأتيهم دراجة نارية مزوّدة بخزان مياه" },
  biz_pricing_title: { en: "Pricing", ar: "الأسعار" },
  biz_exterior_price_label: { en: "Exterior-only price (SAR)", ar: "سعر الغسيل الخارجي فقط (ريال)" },
  biz_full_addon_label: { en: "+ Extra for Exterior & Interior (SAR)", ar: "+ إضافي للغسيل الخارجي والداخلي (ريال)" },
  biz_pricing_hint: { en: "Set your own price for each vehicle size — no fixed markup is added on top.", ar: "حدّد سعرك الخاص لكل حجم مركبة — لا تُضاف أي زيادة ثابتة فوق ذلك." },
  biz_cash_only_label: { en: "Only accept cash paid in person (no cards or Apple Pay)", ar: "قبول الدفع نقدًا فقط في الموقع (بدون بطاقات أو Apple Pay)" },
  biz_vp_exterior: { en: "Exterior only", ar: "خارجي فقط" },
  biz_vp_full: { en: "Exterior + Interior", ar: "خارجي وداخلي" },
  biz_extra_choose: { en: "Choose an extra…", ar: "اختر خدمة إضافية…" },
  biz_extra_custom: { en: "Custom…", ar: "مخصص…" },
  biz_points_rate_label: { en: "Loyalty points rate (points per 1 SAR spent)", ar: "معدل نقاط الولاء (نقاط لكل ريال يُنفق)" },
  biz_extras_title: { en: "Extra services (optional)", ar: "خدمات إضافية (اختياري)" },
  biz_extras_hint: { en: "Only extras you add here will be offered to customers — leave any out that your business doesn't provide.", ar: "لن تُعرض على العملاء إلا الإضافات التي تضيفها هنا — احذف أي شيء لا يقدمه نشاطك." },
  biz_add_extra: { en: "Add an Extra", ar: "إضافة خدمة إضافية" },
  biz_extra_name_placeholder: { en: "e.g. Tire Shine", ar: "مثال: تلميع الإطارات" },
  biz_extra_price_placeholder: { en: "Price", ar: "السعر" },
  biz_scheduling_title: { en: "Scheduling", ar: "الجدولة" },
  biz_concurrent_slots_label: { en: "Bookings allowed per time slot", ar: "عدد الحجوزات المسموح بها لكل موعد" },
  biz_slot_interval_label: { en: "Minutes between time slots", ar: "الدقائق بين المواعيد" },
  biz_auto_accept_label: { en: "Automatically accept new bookings (recommended while you're open)", ar: "قبول الحجوزات الجديدة تلقائيًا (يُنصح به أثناء ساعات العمل)" },
  biz_hours_title: { en: "Operating hours", ar: "ساعات العمل" },
  biz_24_7_label: { en: "Open 24/7", ar: "مفتوح على مدار الساعة طوال الأسبوع" },
  biz_add_period: { en: "Add Another Period", ar: "إضافة فترة أخرى" },
  biz_hours_hint: { en: "These hours apply every day. You can set different hours per day later from your seller dashboard.", ar: "تنطبق هذه الساعات على كل الأيام. يمكنك تحديد ساعات مختلفة لكل يوم لاحقًا من لوحة تحكم البائع." },
  biz_opens_label: { en: "Opens", ar: "يفتح" },
  biz_closes_label: { en: "Closes", ar: "يغلق" },
  val_enter_exterior_price: { en: "Please enter a price for an exterior-only wash.", ar: "يرجى إدخال سعر للغسيل الخارجي فقط." },

  // ---- Rate wash ----
  rate_comment_placeholder: { en: "Tell others what you thought (optional)", ar: "شارك رأيك مع الآخرين (اختياري)" },

  // ---- Menu drawer ----
  menu_order_history: { en: "Order History", ar: "سجل الطلبات" },

  // ---- Home page (additional) ----
  home_toggle_washes: { en: "Show/Hide Car Washes", ar: "إظهار/إخفاء غسيلات السيارات" },
  home_near_me: { en: "Near Me", ar: "بالقرب مني" },
  home_loading_offers: { en: "Loading offers…", ar: "جارٍ تحميل العروض…" },
  home_get_started: { en: "Get started", ar: "ابدأ الآن" },
  home_mobile_wash_title: { en: "Mobile Car Wash", ar: "غسيل سيارات متنقل" },
  home_mobile_wash_desc: { en: "A van comes to your driveway or office", ar: "تأتي شاحنة إلى منزلك أو مكتبك" },
  home_moto_wash_title: { en: "Moto-Mobile Wash", ar: "غسيل بالدراجة النارية" },
  home_moto_wash_desc: { en: "A water-tank motorcycle washes your car at your door", ar: "تغسل دراجة نارية مزوّدة بخزان مياه سيارتك عند بابك" },
  pkg_exterior_title: { en: "Exterior Only", ar: "خارجي فقط" },
  pkg_exterior_desc: { en: "A quick, thorough outside wash", ar: "غسيل خارجي سريع وشامل" },
  pkg_full_title: { en: "Exterior + Interior", ar: "خارجي وداخلي" },
  pkg_full_desc: { en: "Full wash plus interior vacuum & wipe-down", ar: "غسيل كامل مع شفط وتنظيف الداخل" },
  pkg_mobile_title: { en: "Mobile / Motorcycle", ar: "متنقل / دراجة نارية" },
  pkg_mobile_desc: { en: "We come to your home — car or bike", ar: "نأتي إلى منزلك — سيارة أو دراجة" },
  pkg_find_wash: { en: "Find a Wash", ar: "ابحث عن غسيل" },
  pkg_min: { en: "min", ar: "دقيقة" },
  pkg_on_schedule: { en: "On your schedule", ar: "حسب جدولك" },
  offer_nationwide: { en: "Nationwide offer", ar: "عرض على مستوى الدولة" },
  offer_app_exclusive: { en: "App exclusive", ar: "حصري على التطبيق" },
  offer_expires: { en: "Expires", ar: "ينتهي في" },
  offer_ongoing: { en: "Ongoing offer", ar: "عرض مستمر" },

  // ---- Add-on service names (a small, fixed set — worth translating like any other UI text) ----
  addon_tire_shine: { en: "Tire Shine", ar: "تلميع الإطارات" },
  addon_undercarriage: { en: "Undercarriage Wash", ar: "غسيل الهيكل السفلي" },
  addon_wax: { en: "Wax Coating", ar: "طبقة شمع" },
  addon_headlight: { en: "Headlight Restoration", ar: "تجديد المصابيح الأمامية" },
  addon_engine_bay: { en: "Engine Bay Clean", ar: "تنظيف حجرة المحرك" },
  addon_pet_hair: { en: "Pet Hair Removal", ar: "إزالة شعر الحيوانات الأليفة" },
  addon_air_freshener: { en: "Air Freshener", ar: "معطر الجو" },

  choice_exterior_desc: { en: "Outside wash, rinse & dry", ar: "غسيل خارجي، شطف وتجفيف" },
  choice_full_desc: { en: "Full wash plus interior clean", ar: "غسيل كامل مع تنظيف داخلي" },
  bd_no_saved_payment: { en: "No saved payment methods. Add one from your profile.", ar: "لا توجد وسائل دفع محفوظة. أضف واحدة من حسابك." },
  bd_cash_label: { en: "Cash (pay on arrival)", ar: "نقدًا (يُدفع عند الوصول)" },
  bd_cash_only_notice: { en: "This wash only accepts cash paid in person.", ar: "يقبل هذا الغسيل الدفع نقدًا في الموقع فقط." },
  slot_left: { en: "left", ar: "متبقٍ" },
  bd_loading_times: { en: "Loading times…", ar: "جارٍ تحميل الأوقات…" },
  bd_appointments_every: { en: "Appointments every", ar: "مواعيد كل" },
  bd_minutes: { en: "minutes", ar: "دقيقة" },
  bd_up_to: { en: "up to", ar: "حتى" },
  bd_vehicles_per_slot: { en: "vehicles per slot", ar: "مركبات لكل موعد" },
  bd_one_tech_per_slot: { en: "one technician per slot", ar: "فني واحد لكل موعد" },
  bd_address_placeholder: { en: "Street address, city, unit/apt (if any)", ar: "العنوان، المدينة، الوحدة/الشقة (إن وجدت)" },
  bd_special_placeholder: { en: "Any special instructions...", ar: "أي تعليمات خاصة..." },
  bd_base_price: { en: "Base Price:", ar: "السعر الأساسي:" },
  bd_addons_price: { en: "Add-ons:", ar: "الإضافات:" },
  bd_tax: { en: "Tax:", ar: "الضريبة:" },

  // ---- Profile: points, tiers, confirms, toasts ----
  profile_your_balance: { en: "Your balance", ar: "رصيدك" },
  tier_500: { en: "Free Basic Wash (Exterior Only)", ar: "غسيل أساسي مجاني (خارجي فقط)" },
  tier_1000: { en: "Free Full Detail (Exterior + Interior)", ar: "تلميع كامل مجاني (خارجي وداخلي)" },
  tier_1500: { en: "75 SAR Off Any Mobile Service", ar: "خصم 75 ريالًا على أي خدمة متنقلة" },
  tier_2500: { en: "Free Premium Detail + Priority Booking for a Month", ar: "تلميع فاخر مجاني + أولوية الحجز لمدة شهر" },
  profile_confirm_redeem: { en: "Redeem", ar: "استبدال" },
  profile_confirm_redeem_suffix: { en: "points for this reward?", ar: "نقطة مقابل هذه المكافأة؟" },
  profile_redeemed: { en: "Redeemed! Your code:", ar: "تم الاستبدال! رمزك:" },
  profile_confirm_cancel_booking: { en: "Cancel this booking?", ar: "إلغاء هذا الحجز؟" },
  profile_booking_cancelled: { en: "Booking cancelled.", ar: "تم إلغاء الحجز." },
  profile_confirm_remove_payment: { en: "Remove this payment method?", ar: "إزالة وسيلة الدفع هذه؟" },
  profile_payment_removed: { en: "Payment method removed.", ar: "تمت إزالة وسيلة الدفع." },
  profile_confirm_remove_vehicle: { en: "Remove this vehicle?", ar: "إزالة هذه المركبة؟" },
  profile_vehicle_removed: { en: "Vehicle removed.", ar: "تمت إزالة المركبة." },
  profile_my_vehicle: { en: "My Vehicle", ar: "مركبتي" },
  profile_vehicle_added: { en: "Vehicle added.", ar: "تمت إضافة المركبة." },
  profile_enter_4_digits: { en: "Please enter exactly 4 digits.", ar: "يرجى إدخال 4 أرقام بالضبط." },
  profile_payment_added: { en: "Payment method added.", ar: "تمت إضافة وسيلة الدفع." }
};

const I18n = {
  get lang() {
    return localStorage.getItem(I18N_LANG_KEY) || "en";
  },
  set lang(value) {
    localStorage.setItem(I18N_LANG_KEY, value);
  },
  t(key) {
    const entry = I18N_DICT[key];
    if (!entry) return key;
    return entry[I18n.lang] || entry.en;
  },
  applyDirection() {
    const isAr = I18n.lang === "ar";
    document.documentElement.lang = isAr ? "ar" : "en";
    document.documentElement.dir = isAr ? "rtl" : "ltr";
    document.body.classList.toggle("rtl", isAr);
  },
  applyTranslations() {
    I18n.applyDirection();
    document.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = I18n.t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.setAttribute("placeholder", I18n.t(el.dataset.i18nPlaceholder));
    });
  },
  toggle() {
    I18n.lang = I18n.lang === "en" ? "ar" : "en";
    I18n.applyTranslations();
    injectLangToggle(); // refresh button label
  }
};

// Injects a small EN/AR toggle button into the appbar, if one exists and
// doesn't already have a toggle. Safe to call multiple times.
function injectLangToggle() {
  const appbar = document.querySelector(".appbar");
  if (!appbar) return;

  let btn = document.getElementById("langToggleBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "langToggleBtn";
    btn.className = "appbar-btn";
    btn.style.fontSize = "0.72rem";
    btn.style.fontWeight = "700";
    btn.title = "Switch language / تبديل اللغة";
    btn.addEventListener("click", I18n.toggle);

    // Put it at the far end of the appbar — after the spacer if present,
    // otherwise just appended (auth slot, if present, is usually last —
    // insert before it so the avatar/sign-in stays at the very end).
    const authSlot = document.getElementById("authSlot");
    if (authSlot) {
      appbar.insertBefore(btn, authSlot);
    } else {
      appbar.appendChild(btn);
    }
  }
  btn.textContent = I18n.lang === "en" ? "عربي" : "EN";
}

document.addEventListener("DOMContentLoaded", () => {
  I18n.applyTranslations();
  injectLangToggle();
});
