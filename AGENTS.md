# AI Agent Constitution & Design Laws (دستور وقواعد المساعد الذكي)
**Project / المشروع:** Halawa El3antabli  
**Scope / النطاق:** Strict Non-Negotiable Workspace Guidelines for All AI Assistants  
**Enforcement Level / درجة الإلزام:** إلزامي تماماً ومطلق (Strict & Absolute) — يُمنع مخالفته في أي خطوة أو استجابة أو تعديل كود.

---

## 🏛️ 1. الميثاق العام وقواعد الإلزام (Core Constitution)
1. **الالتزام الدائم عبر كل الجلسات (Permanent Adherence):**
   - هذه القواعد ملزمة لأي نموذج أو مساعد ذكاء اصطناعي (Antigravity, Gemini, Cursor, Claude, إلخ) في كل محادثة، حتى بعد إعادة تعيين السياق أو بدء جلسة جديدة.
   - يُمنع منعاً باتاً كسر أو تجاوز أي قاعدة من القواعد المدرجة أدناه تحت أي مبرر.
2. **الحفاظ على سلامة الكود القائم (Code Integrity):**
   - عدم حذف أو إفساد أي ميزات أو مكونات تعمل بنجاح في المشروع دون توجيه صريح ومكتوب من المستخدم.
   - في حال طلب تعديل أو إعادة تصميم، يتم التعديل الموضعي وتحديث المكونات مع حماية المسارات وبنية النظام الحالية.
3. **الجودة والتحقق قبل التسليم (Quality Gates & Verification):**
   - لا يُعتبر أي كود مكتملاً إلا بعد اختباره والتأكد من خلوه التام من أي أخطاء برمجية أو أخطاء في الـ Syntax أو الـ Runtime.
   - مراجعة أي واجهة يتم بناؤها وتطبيق معايير الجودة الصارمة المحددة أدناه.

---

## 🎨 2. ميثاق محاربة الابتذال والتكرار النمطي (Anti-AI Slop & Editorial Taste)
*مستوحى من معايير: Hallmark, Taste-Skill, Impeccable*

1. **رفض القوالب الجاهزة للذكاء الاصطناعي (Refuse the Default AI Rhythm):**
   - يُمنع إنشاء صفحات مكررة بالهيكل المبتذل المعتاد: (Hero في المنتصف -> 3 بطاقات متطابقة في صف واحد -> زر CTA نمطي -> تذييل باهت).
   - لكل صفحة هوية بصرية متميزة وتوزيع عناصر مدروس ومبتكر (Structural Variety & Authentic Asymmetry).
2. **الخطوط والطباعة الراقية (Type Direction & Hierarchy):**
   - يُمنع استخدام خط Inter الافتراضي كخيار وحيد لكل شيء دون دراسة.
   - استخدام تزاوج خطوط أنيق واحترافي (Heading Font قوي ومميز، مع Body Font مريح للقراءة وشديد الوضوح).
   - تناسق المسافات الرأسية وأحجام العناوين مع مراعاة `line-height` الطبيعي (1.1 - 1.25 للعناوين، 1.5 - 1.7 للنصوص).
3. **نقاء وبراعة الألوان والأسطح (Color Mastery & Neo-Kinpaku/OKLCH):**
   - تجنب التدرجات البنفسجية/الزرقاء الساذجة الشائعة في تصاميم الذكاء الاصطناعي البدائية.
   - استخدام لوحات ألوان محسوبة بدقة (مثل مساحات OKLCH أو درجات HSL الغنية) تمنح فخامة حقيقية:
     - أرضيات داكنة دافئة أو أسطح نقية ذات عمق وتدرج هندسي واضح.
     - نقاط جذب لونية بارزة (Accent Anchors) متناسقة مع طبيعة المشروع.
     - تباين عالٍ ومريح للنصوص فوق الخلفيات دون رماديات باهتة تؤذي العين.
4. **التخلص من الإطارات الزائدة (Restraint in Chrome):**
   - تجنب وضع بطاقات داخل بطاقات بدون مبرر هيكلي (No cards nested in cards).
   - التخلص من الأيقونات المربعة المغلفة المتكررة فوق كل عنوان، واستبدالها بتوجيه بصري ذكي ومتقن.

---

## 📐 3. معايير هندسة الواجهات الصارمة (Web Interface Guidelines - Vercel Standard)
*مستوحى من: Vercel Web Interface Guidelines*

### أ) إمكانية الوصول والتنقل (Accessibility & Semantics)
- **HTML الدلالي الصريح أولاً:** استخدام `<button>` للأفعال التفاعلية، و `<a>` للتنقل بين الصفحات والروابط. **ممنوع نهائياً استخدام `<div onClick>` كبديل للأزرار والروابط.**
- **التسميات والوصول:**
  - كل زر يعتمد على أيقونة فقط (Icon-only button) يجب تزويده بـ `aria-label` واضح ومحدد.
  - كل حقل إدخال في النماذج يحتاج `<label>` صريح ومرتبط به (عبر `htmlFor` / `id`) أو `aria-label`.
  - الأيقونات التزيينية يجب أن تحمل `aria-hidden="true"`.
  - الصور تتطلب وصف `alt` دقيق، أو `alt=""` إن كانت زخرفية بحتة.
  - التحديثات الديناميكية غير المتزامنة (إشعارات، رسائل تحقق، تنبيهات) تتطلب `aria-live="polite"`.
- **دعم لوحة المفاتيح والتركيز (Keyboard & Focus):**
  - دعم التنقل الكامل عبر الأسهم وزر `Tab` وزر `Enter` / `Space`.
  - حالة التركيز المرئية إلزامية عبر `:focus-visible`. **يُمنع منعاً باتاً كتابة `outline: none` أو `outline-none` دون توفير بديل تركيز فوري واضح.**
  - دعم الانتقال المباشر للمحتوى الرئيسي عبر رابط تخطي (Skip Link)، وتعيين `scroll-margin-top` على العناوين لتجنب اختفائها تحت الشريط العلوي الثابت.

### ب) النماذج وحقول الإدخال (Forms & Inputs)
- تزويد كل حقل بنوع `type` دقيق (`email`, `tel`, `number`, إلخ) و `autocomplete` المناسب لتجربة ملء سلسة.
- منع التدقيق الإملائي `spellCheck={false}` على حقول الإيميل، الأكواد، وأسماء المستخدمين.
- **ممنوع حظر اللصق:** لا يجوز إيقاف أو تعطيل اللصق (`onPaste` مع `preventDefault`) في أي حقل.
- زر الإرسال يبقى نشطاً حتى بدء الطلب، وتظهر مؤشرات تحميل واضحة أثناء المعالجة، مع إظهار الأخطاء محلياً بجوار الحقول المعنية والتركيز التلقائي على أول حقل به خطأ.

### ج) معايير الخطوط والأرقام (Typography & Copy Standards)
- استخدام علامة الحذف الصحيحة الكلمية `…` وليس ثلاث نقاط متفرقة `...`.
- استخدام الأرقام الجدولية `font-variant-numeric: tabular-nums` في الجداول وقوائم الأسعار والمقارنات الحسابية لضمان المحاذاة.
- تطبيق `text-wrap: balance` أو `text-pretty` على العناوين لمنع الكلمات المعلقة المفردة في السطور.
- حماية الحاويات من فيضان النصوص الطويلة عبر `truncate` أو `line-clamp` أو `break-words`، مع تعيين `min-w-0` على عناصر Flex الفرعية.

### د) الأداء واستقرار التخطيط (Performance & Stability)
- تحديد أبعاد صريحة `width` و `height` و `aspect-ratio` على الصور وعناصر الفيديو لمنع قفز التخطيط التراكمي (CLS).
- تفعيل التحميل الكسول `loading="lazy"` للصور والوسائط خارج نطاق الشاشة الأولي، ومنح أولوية تحميل `fetchpriority="high"` للعناصر الرئيسية العلوية فقط.
- تجنب قراءة أبعاد الـ DOM المتكررة أثناء دورة الـ Render (`getBoundingClientRect`, `offsetHeight`, إلخ).
- تجنب صور GIF المتحركة الثقيلة، واستبدالها بفيديوهات حديثة خفيفة (`<video autoplay muted loop playsinline>`) مع التوقف عند تفضيل تقليل الحركة.
- مراعاة مناطق الأمان في الهواتف الذكية عبر `env(safe-area-inset-*)`.

---

## ⚡ 4. ميثاق الحركة والتحريك عالي الأداء (Motion & GSAP Standards)
*مستوحى من: GSAP Skills, UI/UX Pro Max Motion Engine*

1. **احترام تفضيل تقليل الحركة (prefers-reduced-motion):**
   - إلزامي تماماً: توفير بديل ثابت أو إيقاف الحركة التلقائية عند تفعيل خيار `prefers-reduced-motion` في نظام المستخدم.
2. **الأداء الفائق (60fps GPU Composited Motion):**
   - حصر التحريك على خواص تسريع كرت الشاشة (`transform` و `opacity`) فقط.
   - **يُمنع منعاً باتاً كتابة `transition: all`؛** يجب تسمية وتحديد الخصائص المراد تحريكها بدقة (مثل `transition: transform 0.2s ease, opacity 0.2s ease`).
   - تجنب تحريك الخصائص التي تعيد حساب التخطيط (مثل `width`, `height`, `top`, `left`, `margin`).
3. **قواعد استخدام GSAP:**
   - تنظيم المشاهد والحركات عبر GSAP Timelines بتوقيتات متناسقة ومتناغمة (Choreography).
   - استخدام `gsap.context()` لضمان التنظيف السليم (Cleanup) ومنع تسرب الذاكرة أو تعارض الحركات.
   - تحسين أداء ScrollTrigger وعدم تحميل الـ DOM عمليات معالجة ثقيلة أثناء التمرير.
   - حركات الـ Micro-interactions يجب أن تكون سريعة، مريحة، وغير معطلة لتفاعل المستخدم (150ms - 300ms).

---

## 🧭 5. قائمة الممنوعات القطعية (Strict Anti-Patterns - ZERO TOLERANCE)
يُمنع على أي مساعد ذكاء اصطناعي كتابة أي مما يلي:
❌ استخدام `<div onClick>` أو `<span onClick>` بدلاً من `<button>` أو `<a>`.  
❌ كتابة `outline: none` أو `outline-none` دون تعويضها بحالة تركيز واضحة `:focus-visible`.  
❌ كتابة `transition: all`.  
❌ أزرار أو روابط بدون حالات `hover` و `active` و `focus`.  
❌ أزرار أيقونات بدون `aria-label`.  
❌ حقول إدخال بدون `<label>` مرتبط أو `aria-label`.  
❌ منع المستخدم من اللصق في الحقول (`preventDefault` مع `onPaste`).  
❌ صور بدون تحديد `width` و `height` أو `aspect-ratio`.  
❌ استخدام خط واحد وحجم نص متطابق لكل العناصر دون تباين هرمي واضح.  
❌ استخدام نصوص بدائية أو تصاميم مؤقتة غير مكتملة (No placeholders or MVP slop).  
❌ حذف ملفات أو تخريب وظائف سابقة بدون إذن مباشر.  

---

## 📚 6. فهرس المهارات المدمجة بالمشروع (Installed Local Skills)
تم تثبيت مراجع المهارات التالية محلياً داخل المجلد [.agents/skills/](file:///d:/Programming/Halawa%20El3antabli/.agents/skills) كأدلة عمل فورية:
- [web-design-guidelines](file:///d:/Programming/Halawa%20El3antabli/.agents/skills/web-design-guidelines/SKILL.md) — المعايير القياسية الصارمة من Vercel لهندسة الويب وإمكانية الوصول.
- [hallmark](file:///d:/Programming/Halawa%20El3antabli/.agents/skills/hallmark/SKILL.md) — مهارة التصميم الفريد ومكافحة قوالب الذكاء الاصطناعي النمطية.
- [taste-skill](file:///d:/Programming/Halawa%20El3antabli/.agents/skills/taste-skill/SKILL.md) — الإخراج الفني الاحترافي والذوق التحريري للواجهات الحديثة.
- [ui-ux-pro-max](file:///d:/Programming/Halawa%20El3antabli/.agents/skills/ui-ux-pro-max/SKILL.md) — الذكاء التصميمي الشامل (أنظمة الألوان، الخطوط، وتناسق الواجهات).
- [impeccable](file:///d:/Programming/Halawa%20El3antabli/.agents/skills/impeccable/SKILL.md) — نظام الحرفية العالية Neo-Kinpaku وهندسة الأسطح.
- [gsap-core](file:///d:/Programming/Halawa%20El3antabli/.agents/skills/gsap-core/SKILL.md) & [gsap-scrolltrigger](file:///d:/Programming/Halawa%20El3antabli/.agents/skills/gsap-scrolltrigger/SKILL.md) — محرك التحريك المتقدم بأعلى أداء 60fps.
- [improve-ui](file:///d:/Programming/Halawa%20El3antabli/.agents/skills/improve-ui/SKILL.md) & [baseline-ui](file:///d:/Programming/Halawa%20El3antabli/.agents/skills/baseline-ui/SKILL.md) — تدقيق الواجهات والأنظمة التصميمية المرجعية.
- [open-design](file:///d:/Programming/Halawa%20El3antabli/.agents/skills/open-design/SKILL.md) & [platform-design](file:///d:/Programming/Halawa%20El3antabli/.agents/skills/platform-design/SKILL.md) — عقود وتصاميم المنصات الحديثة.

---

## 💬 7. ميثاق التواصل وتنفيذ المهام (Execution & Communication)
- التواصل بأسلوب مهني، دقيق، وواضح باللغة العربية.
- توضيح ما تم إنجازه بدقة مع تزويد روابط مباشرة للملفات المعدلة.
- الالتزام التام بتطبيق هذه المهارات دون أي استثناء في كل كود يتم كتابته.
