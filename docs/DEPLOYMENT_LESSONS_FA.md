# راهنمای استقرار؛ از لوکال به GitHub و VPS

این راهنما از استقرار واقعی `vt-shop` تهیه شده است؛ شامل محل قرار گرفتن
تنظیمات و داده‌ها، خطاهای رخ‌داده و بررسی‌هایی که باید پیش از اعلام موفقیت
انجام شوند. اطلاعات وضعیت مربوط به **۷ اکتبر ۲۰۲۶** است؛ در اجرای بعدی، پورت‌ها،
نسخه‌های نصب‌شده و وضعیت سرور را دوباره بررسی کنید.

مراجع: [تنظیمات استقرار](DEPLOYMENT.md)، [وضعیت فعلی](SESSION_STATE.md)،
[راهنمای مدیریت و ورود کالا](ADMIN_GUIDE.md) و
[تاریخچهٔ اجرا](IMPLEMENTATION_HISTORY.md).

## ۱. پیش از هر تغییری، اطلاعات مقصد را مشخص کنید

| مورد | مقدار این پروژه | برای پروژهٔ بعدی |
| --- | --- | --- |
| مخزن | `Tarokh11/vt-shop`، عمومی | مالک، نام و سطح دسترسی را مشخص کنید |
| شاخهٔ انتشار | `vt-shop` | با trigger در workflow یکسان باشد |
| remote روی لوکال | `vt-shop` | `origin` این workspace به مخزن Nora وصل است |
| GitHub Environment | `vt-shop` | با `jobs.deploy.environment` یکسان باشد |
| سرور / SSH | `94.184.45.92:22` | از اطلاعات تأییدشدهٔ مالک استفاده کنید |
| کاربر SSH | `root` | برای استقرار جدید، حساب و کلید اختصاصی مناسب‌تر است |
| مسیر برنامه روی سرور | `/opt/vt-shop` | مسیر مطلق و جدا از پروژه‌های دیگر |
| نام پروژهٔ Compose | `vtshop` | نام یکتا؛ در همهٔ دستورها ثابت باشد |
| آدرس فعلی | `http://94.184.45.92:8084` | پورت آزاد یا دامنهٔ تنظیم‌شده |
| سرویس‌ها | `db`, `backend`, `frontend`, `proxy` | مطابق فایل Compose مقصد |

پورت درخواستی اولیه `8081` بود؛ بررسی سرور نشان داد `8080` تا `8083`
اشغال‌اند و `8084` انتخاب شد. پورت را پیش از نوشتن آدرس‌ها و راه‌اندازی بررسی کنید:

```sh
# روی سرور؛ فقط مشاهده
ss -ltnp
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
```

نام `vtshop` نام داخلی استقرار است و به‌تنهایی DNS یا آدرس `/vtshop` ایجاد
نمی‌کند. انتشار زیر یک مسیر مانند `/vtshop` نیاز به تنظیم مسیرهای برنامه و
پروکسی دارد؛ این پروژه فعلاً از پورت مستقل استفاده می‌کند.

پیش‌نیاز VPS: Git، Docker Engine و افزونهٔ `docker compose`، دسترسی SSH و
اجازهٔ استفاده از Docker، فضای کافی برای imageها و volumeها، و امکان اتصال
به GitHub و registry/packageهای build. برای انتشار مستقیم، firewall باید
پورت انتخاب‌شده را اجازه دهد. نسخهٔ Compose را با `docker compose version`
بررسی کنید؛ گزینه‌های `--wait` و `--interactive=false` در workflow استفاده شده‌اند.

## ۲. چه چیزی باید کجا قرار بگیرد؟

| نوع | محل | وارد Git شود؟ |
| --- | --- | --- |
| کد، migrationها، Dockerfileها، workflow | مخزن | بله |
| قالب تنظیمات بدون رمز | `.env.example` و `deploy/vtshop.env.example` | بله |
| تنظیمات واقعی لوکال | `.env` روی دستگاه توسعه | خیر |
| تنظیمات واقعی سرور | `/opt/vt-shop/.env.production`، مجوز `600` | خیر |
| کلید SSH و host key تأییدشده | GitHub Secrets محیط مقصد | کلید خصوصی خیر |
| محصولات، قیمت، موجودی، کاربران، سفارش‌ها | PostgreSQL مقصد | خیر |
| فایل عکس آپلودشده | volume رسانهٔ سرور؛ داخل backend در `/app/media` | خیر |
| عکس‌های نمونهٔ قابل‌استفادهٔ مجدد | `backend/catalog/sample_images/products/` | بله |
| فایل‌های static جمع‌آوری‌شدهٔ Django | volume در `/app/staticfiles` | خیر؛ دوباره ساخته می‌شوند |
| خروجی Next.js و وابستگی‌ها | image هنگام build؛ `.next` و `node_modules` | خیر |
| backup دیتابیس و رسانه | محل خصوصی خارج مخزن، با نسخهٔ خارج VPS | خیر |

**Push کد، دیتابیس و عکس‌های آپلودشدهٔ لوکال را منتقل نمی‌کند.**
`migrate` ساختار دیتابیس را آماده می‌کند؛ این پروژه کاتالوگ لوکال را با آن
وارد دیتابیس سرور نمی‌کند. `collectstatic` نیز عکس محصولات را منتقل نمی‌کند.

فایل `PRODUCTION _vtshop.txt` حاوی کلید خصوصی بود؛ اکنون از Git و Docker
build context حذف شده است. فایل نمونهٔ `action-deploy.yml` فقط مرجع ورودی بود؛
workflow واقعی `.github/workflows/deploy.yml` است. فایل‌های فشردهٔ پروژه، backup
و خروجی‌های تولیدشده را با `git add .` وارد مخزن عمومی نکنید.

## ۳. اجرای لوکال و سرور را جدا نگه دارید

| مورد | لوکال | سرور |
| --- | --- | --- |
| فایل Compose | `compose.yaml`، فقط PostgreSQL | `compose.production.yaml`، چهار سرویس |
| فایل env | `.env` | `.env.production` |
| Django | Python venv و dev server | Gunicorn در کانتینر |
| Next.js | `next dev` | build و `next start` در کانتینر |
| PostgreSQL host از دید Django | معمولاً `127.0.0.1` | `db` |
| پورت عمومی | frontend `3000` | proxy `8084` |
| debug | با launcher لوکال فعال | غیرفعال |

در این فرایند، Compose عمومی ابتدا برای استقرار تغییر کرده بود؛ برای حفظ
اجرای لوکال، آن را به حالت DB-only بازگرداندیم و فایل production مستقل ساختیم.
برای پروژهٔ بعدی از ابتدا این جداسازی را رعایت کنید.

اجرای معمول لوکال پس از آماده‌سازی README:

```sh
docker compose up -d db
./run-dev.sh
```

launcher، `.env` را بارگذاری می‌کند و Django/Next را روی `8001/3000` اجرا
می‌کند. در بررسی‌های این استقرار یک Django قبلی روی `8010` فعال بود؛ این عدد
پیش‌فرض launcher نیست. دو Next dev هم‌زمان برای همین پوشه اجرا نکنید.
برای تغییر پورت: `BACKEND_PORT=8002 FRONTEND_PORT=3001 ./run-dev.sh`.

در دستورهای مستقیم Django، env را صریح بارگذاری کنید؛ Django این پروژه
خودکار `.env` را نمی‌خواند:

```sh
set -a
. ./.env
set +a
.venv/bin/python backend/manage.py check
```

داخل کانتینر، `127.0.0.1` همان کانتینر است. نشانی داخلی فعلی برای build
فرانت‌اند `BACKEND_ORIGIN=http://proxy:8080` است. مرورگر از `/api/...` روی
همان آدرس عمومی سایت استفاده می‌کند؛ hostname داخلی Docker را به مرورگر ندهید.

## ۴. تنظیمات مقصد و Secrets را جایگذاری کنید

### GitHub

در **Settings → Environments → vt-shop → Secrets**:

| Secret | مقدار فعلی / نوع مقدار |
| --- | --- |
| `PRODUCTION_HOST` | `94.184.45.92`؛ بدون `http://` |
| `PRODUCTION_PORT` | `22`؛ پورت SSH، نه پورت سایت |
| `PRODUCTION_USER` | `root` |
| `PRODUCTION_PATH` | `/opt/vt-shop`؛ بدون newline اضافه |
| `PRODUCTION_SSH_KEY` | کلید خصوصی کامل چندخطی، شامل BEGIN/END |
| `PRODUCTION_KNOWN_HOSTS` | host key تأییدشدهٔ همین سرور و پورت |

کلید خصوصی موجود در این پروژه با اجازهٔ صریح مالک به Secrets ارسال شد.
این اجازه را برای کلید یا مقصد دیگر فرض نکنید. مقدار Secret را در لاگ، توضیح
کامیت یا Markdown ننویسید. `ssh-keyscan` صرفاً کلید دریافتی را جمع‌آوری می‌کند؛
fingerprint باید از مسیر مورداعتماد با سرور تطبیق داده شود. بررسی
`StrictHostKeyChecking=yes` را حفظ کنید.
workflow فعلی passphrase را باز نمی‌کند؛ کلید ورودی باید با روش فعلی بدون
تعامل قابل استفاده باشد. برای پورت SSH غیراستاندارد، قالب known_hosts و مقدار
`PRODUCTION_PORT` را با همان مقصد هماهنگ کنید.

workflow فعلی مخزن عمومی را با HTTPS روی VPS fetch می‌کند. برای مخزن خصوصی،
دسترسی خواندن مخزن روی سرور نیز لازم است؛ کلید اتصال Actions به VPS خودبه‌خود
مجوز خواندن مخزن خصوصی را به VPS نمی‌دهد.

### فایل server env

برای نصب اول در یک مسیر جدید و خالی، روی سرور:

```sh
git clone --branch vt-shop https://github.com/Tarokh11/vt-shop.git /opt/vt-shop
cd /opt/vt-shop
cp deploy/vtshop.env.example .env.production
chmod 600 .env.production
```

در نصب موجود، `.env.production` را با قالب یا env لوکال بازنویسی نکنید.
دو فیلد خالی `DJANGO_SECRET_KEY` و `POSTGRES_PASSWORD` باید روی سرور با
مقادیر مستقل و تصادفی پر شوند؛ قالب به‌تنهایی قابل اجرا نیست. workflow نبودن
فایل را پیش از تغییر checkout و کانتینرها رد می‌کند.

| تغییر مقصد | محل‌های هماهنگ‌سازی |
| --- | --- |
| IP / دامنه / پورت عمومی | `DJANGO_ALLOWED_HOSTS`، `DJANGO_CSRF_TRUSTED_ORIGINS`، `FRONTEND_ORIGIN`، `ZARINPAL_CALLBACK_URL` و پورت Compose |
| شیوهٔ دسترسی | `SHOP_BIND_ADDRESS`؛ `0.0.0.0` برای انتشار مستقیم، `127.0.0.1` پشت proxy میزبان |
| نام دیتابیس و کاربر | `POSTGRES_DB`، `POSTGRES_USER`؛ مشخصات volume موجود را هم بررسی کنید |
| نام کوکی | `DJANGO_SESSION_COOKIE_NAME` و `DJANGO_CSRF_COOKIE_NAME`؛ فرانت‌اند را rebuild کنید |
| HTTP به HTTPS | secure redirect، secure cookies، HSTS و forwarding پروتکل |

Allowed hosts شامل hostname/IP است؛ trusted origins و frontend origin شامل
scheme و پورت هستند. در محیط HTTP فعلی، secure cookies و redirect به HTTPS
غیرفعال‌اند ولی debug خاموش است. برای HTTPS، تنظیمات بخش مربوط در
[DEPLOYMENT.md](DEPLOYMENT.md#move-to-domain-and-https) را اعمال کنید.

روی IP مشترک، پورت کوکی‌ها را جدا نمی‌کند؛ نام‌های `vtshop_sessionid` و
`vtshop_csrftoken` برای جلوگیری از تداخل با پروژه‌های دیگر انتخاب شدند.
نام CSRF مورداستفادهٔ مرورگر با build argument
`NEXT_PUBLIC_CSRF_COOKIE_NAME` از env مقصد وارد image می‌شود؛ تغییر فقط env
اجرای کانتینر برای اصلاح build قبلی کافی نیست. `BACKEND_ORIGIN` نیز در تنظیمات
rewrite هنگام build استفاده می‌شود.

تغییر `POSTGRES_PASSWORD` در env، رمز role موجود در volume قبلی را خودکار
تغییر نمی‌دهد؛ هماهنگی تغییر رمز دیتابیس و برنامه را جداگانه انجام دهید.

## ۵. ترتیب درست انتشار کد

۱. دستورهای `AGENTS.md`، وضعیت جلسه و برنامهٔ فعال را بخوانید؛ diff و remoteها
را بررسی کنید. فایل‌های نامرتبط یا خصوصی را stage نکنید.

```sh
git status --short
git remote -v
git branch --show-current
git diff --check
```

۲. بررسی مرتبط با تغییر را انجام دهید. برای تغییر workflow، تست‌های موجود:

```sh
python3 -m unittest discover -s tests -p test_deployment_workflow.py
.venv/bin/ruff check tests/test_deployment_workflow.py
```

تغییر فرانت‌اند به lint، typecheck و build مرتبط نیاز دارد. تغییر مدل به
بررسی migration و تست دامنهٔ مربوط نیاز دارد. نتیجهٔ این بررسی‌ها را ثبت کنید.

۳. فقط فایل‌های همان تغییر را commit کنید و remote صحیح را push کنید:

```sh
git push vt-shop vt-shop
```

۴. Actions باید همین SHA را منتشر کند. ترتیب فعلی workflow:

1. بررسی Secrets، کلید و env سرور؛ بررسی پاک بودن فایل‌های tracked سرور.
2. Fetch و checkout دقیق `github.sha`؛ بررسی config و build.
3. شروع DB و انتظار برای سلامت آن.
4. اجرای migration و collectstatic.
5. شروع سرویس‌ها و انتظار برای سلامت؛ بازسازی proxy برای config و upstream جدید.
6. Django system check و نمایش وضعیت چهار سرویس.

پیش از تغییرات داده/ساختار، backup معتبر داشته باشید. فایل tracked را مستقیم
روی سرور ویرایش نکنید؛ env خصوصی از checkout مستقل است. workflow از
`git reset --hard` برای پاک کردن تغییرات نامشخص استفاده نمی‌کند.

**خطای واقعی: Docker ورودی SSH را مصرف کرد.** وقتی کل اسکریپت با heredoc
به SSH داده شد، `docker compose run` ادامهٔ اسکریپت را از stdin خواند؛ بعد از
migration کار متوقف شد ولی Action موفق نشان داده شد. شکل فعلی را حفظ کنید:

```sh
docker compose --env-file .env.production -f compose.production.yaml --project-name vtshop run --rm -T --interactive=false backend python manage.py migrate --noinput </dev/null
docker compose --env-file .env.production -f compose.production.yaml --project-name vtshop exec -T backend python manage.py check </dev/null
```

`-T` به‌تنهایی تضمین نمی‌کند stdin مصرف نشود. این بستن ورودی برای دستورهای
غیرتعاملی است؛ برای `createsuperuser` دستی یا restore که عمداً ورودی می‌خواند
آن را کپی نکنید. تست موجود اجرای تمام **۹ دستور Docker** و توقف در نبود env
را بررسی می‌کند.

## ۶. محصولات و عکس‌ها را چگونه منتقل کنیم؟

### حالت A: فقط نمایش کاتالوگ نمونه

در نصب تازه، ابتدا یک حساب staff واقعی بسازید؛ سپس seed را یک بار اجرا کنید:

```sh
cd /opt/vt-shop
docker compose --env-file .env.production -f compose.production.yaml --project-name vtshop exec backend python manage.py createsuperuser
docker compose --env-file .env.production -f compose.production.yaml --project-name vtshop exec backend python manage.py seed_stationery
```

seed، داده‌های تعریف‌شده در کد و عکس‌های نمونهٔ داخل image را در DB و media
مقصد قرار می‌دهد؛ عکس‌های آپلودشدهٔ دلخواه لوکال را منتقل نمی‌کند.
در استقرار فعلی، ۱۱ محصول و عکس با حساب audit غیرفعال `vtshop-seed` ساخته
شدند؛ رمز آن unusable است و حساب ورود مدیر محسوب نمی‌شود.

seed را در هر deploy اجرا نکنید: کد آن محصول‌ها و قیمت‌ها را با نمونه‌ها
به‌روزرسانی می‌کند. ثبت stock نمونه از تکرار adjustment هم‌دلیل جلوگیری
می‌کند، اما این ویژگی به معنی حفظ تمام ویرایش‌های تجاری نیست. نبود staff
در seed فعلی فقط پیام خطا می‌دهد؛ exit code به‌تنهایی کافی نیست. خروجی و تعداد
محصول‌ها را بررسی کنید.

### حالت B: ورود کالاهای واقعی از Excel

روی **دیتابیس مقصد** دسته‌ها، برندها و مقادیر ویژگی را آماده کنید، قالب جدید
را از Django Admin بگیرید و فایل را وارد کنید. عکس‌ها را پس از import از پنل
محصول یا Admin آپلود کنید؛ مسیر عکس در کامپیوتر لوکال روی VPS قابل استفاده نیست.

`sku` و `product_slug` را برای به‌روزرسانی ثابت نگه دارید.
`price_irr` ریال صحیح است و `stock_quantity` موجودی نهایی مطلوب؛ اختلاف موجودی
در تاریخچه ثبت می‌شود. راهنمای کامل: [ADMIN_GUIDE.md](ADMIN_GUIDE.md#excel-catalog-import).

### حالت C: انتقال کامل دیتابیس و رسانهٔ لوکال

این مسیر برای انتقال همان داده‌هاست؛ seed جایگزین آن نیست:

1. منبع درست را تعیین کنید؛ DB لوکال را با DB فروشگاه زنده اشتباه نگیرید.
2. نوشتن در منبع را هنگام تهیهٔ نسخهٔ هماهنگ DB/media متوقف کنید.
3. از PostgreSQL با `pg_dump` خروجی بگیرید و **همراه با** کل media منتقل کنید.
   پوشهٔ خام دیتابیس یا volume زنده را به‌جای dump کپی نکنید.
4. dump و رسانه را با SSH/SCP به محل خصوصی مقصد برسانید؛ از Git استفاده نکنید.
5. برای بازیابی کامل، یک DB خالی و media مقصد مشخص و جدا آماده کنید.
   dump کامل را روی DB قبلاً migrateشده یا دارای سفارش restore نکنید.
6. restore را با توقف روی خطا انجام دهید، مالکیت role مقصد را هماهنگ کنید،
   سپس migrationهای جدید، collectstatic و راه‌اندازی را انجام دهید.
7. تعداد کالاها، SKU/شناسه‌ها، موجودی، حساب‌ها و URL عکس‌ها را بررسی کنید.

DB مسیر فایل را نگه می‌دارد، media خود فایل را؛ بدون یکی از این دو عکس‌ها
درست نمایش داده نمی‌شوند. شناسه‌های variant و ارتباط سفارش/موجودی را حفظ کنید.
DB کامل، حساب‌ها و اطلاعات حساس منبع را هم منتقل می‌کند؛ برای انتقال صرفاً
کاتالوگ، حالت B را انتخاب کنید.

volumeهای فعلی با project name ثابت:

- `vtshop_postgres_data`: دیتابیس.
- `vtshop_media_data`: فایل‌های آپلودشده.
- `vtshop_static_data`: static قابل‌بازتولید.

نام volume واقعی را با `docker volume ls` بررسی کنید. تغییر project name ممکن
است volume تازه و DB ظاهراً خالی ایجاد کند. `docker compose down -v` یا prune
روی سرور مشترک بخشی از استقرار عادی نیست؛ ممکن است داده‌ها را از بین ببرد.

## ۷. بررسی پس از انتشار؛ سبز شدن Action کافی نیست

روی سرور، از همان پوشه و با همان env/file/project استفاده کنید:

```sh
cd /opt/vt-shop
git rev-parse HEAD
docker compose --env-file .env.production -f compose.production.yaml --project-name vtshop ps
docker compose --env-file .env.production -f compose.production.yaml --project-name vtshop logs --tail=100 backend frontend proxy
```

SHA را با run مقایسه کنید؛ چهار سرویس باید healthy باشند. `/healthz` فقط
زنده بودن proxy را می‌سنجد، `/api/v1/ready/` برای readiness backend است.
Healthcheck Django باید Host مجاز و پروتکل سازگار با HTTPS redirect داشته باشد؛
تست loopback بدون این headerها ممکن است با وجود سلامت برنامه شکست بخورد.

از یک اتصال **بیرون VPS** هم بررسی کنید:

```sh
curl --fail --show-error http://94.184.45.92:8084/api/v1/ready/
curl --fail --show-error http://94.184.45.92:8084/api/v1/catalog/products/
```

- صفحهٔ اصلی، `/products` و یک صفحه مانند `/products/document-folder`.
- CSS و JS واقعاً اشاره‌شده در HTML همان build: پاسخ ۲۰۰، MIME مناسب و body کامل.
- فایل‌های runtime/lazy و RSC، ناوبری صفحات و کنسول مرورگر.
- تعداد محصولات؛ ۱۱ فقط معیار همین کاتالوگ نمونه است.
- عکس مستقیم `/media/...` و مسیر بهینه‌سازی `/_next/image` با media نسبی.
  یک URL مطلق دلخواه ممکن است به‌دلیل تنظیمات image پاسخ ۴۰۰ بدهد.
- Admin/panel، نشست و CSRF؛ صرفاً نمایش فرم ورود کافی نیست.
- لوکال: صفحه و API روی پورت واقعاً فعال، با تنظیمات قبلی.

وقتی مرورگر متصل نیست، نتیجه را «بررسی HTTP و فایل‌ها» ثبت کنید؛ بررسی ظاهر،
کلیک و خرید انجام‌شده محسوب نمی‌شود. در بررسی قبلی، HTTP/asset تست شد ولی
visual QA به‌دلیل نبود مرورگر متصل انجام نشد.

## ۸. خطای «فقط HTML لود می‌شود» و تصمیم درست

در این استقرار HTML پاسخ ۲۰۰ داشت اما درخواست بیرونی با `/chunks/` reset
می‌شد. همان فایل داخل VPS پاسخ ۲۰۰ داشت و درخواست ناموفق در access log
Nginx دیده نمی‌شد؛ بنابراین شواهد به مسیر شبکه اشاره داشت. عامل دقیق شبکه
مشخص نشد. این مشکل نشانهٔ خراب بودن فایل محصول یا وصل بودن برنامه به Docker نبود.

ترتیب تشخیص برای بار بعد:

1. از HTML تازه یا Network مرورگر نام واقعی CSS/JS را بردارید؛ نام hash قدیمی را حدس نزنید.
2. status، MIME و body را از بیرون بررسی کنید؛ ۲۰۰ با body HTML برای JS درست نیست.
3. همان URL را داخل VPS از proxy و در صورت نیاز frontend درخواست کنید.
4. access/error log، mountها و کانتینرها را بررسی کنید.
5. اگر داخل سالم و بیرون reset است، مسیر شبکه را بررسی کنید؛ اگر ۴۰۴ است،
   مسیر فایل، build، proxy یا HTML کش‌شده را بررسی کنید.

راه‌حل فعلی فقط در production Nginx است: مسیر عمومی
`/_next/static/bundles/` به فایل اصلی `/_next/static/chunks/` نگاشت می‌شود و
ارجاع‌های HTML/CSS/JS/RSC جایگزین می‌شوند. upstream برای substitution بدون
فشرده‌سازی خوانده می‌شود و Nginx برای کلاینت gzip می‌کند.
تغییر صرف HTML کافی نیست؛ runtime هم مسیر فایل‌های بعدی را تولید می‌کند.
تغییر صرف `assetPrefix` نیز بخش `/chunks/` را حذف نمی‌کند.

این workaround را برای هر پروژه خودکار اعمال نکنید؛ ابتدا همان شواهد را
تأیید کنید. با هر تغییر Next یا قالب build، مسیرهای runtime/lazy را دوباره
بررسی کنید. پس از تغییر Nginx، workflow فعلی proxy را با
`--no-deps --force-recreate --wait proxy` بازسازی می‌کند: bind mount تک‌فایل
ممکن است پس از checkout به inode قبلی اشاره کند و upstream جدید نیز باید
دوباره resolve شود. reload ساده همیشه برای این وضعیت کافی نیست.

پس از رفع واقعی، hard refresh برای HTML کش‌شده مفید است؛ درخواست resetشده
را با توصیهٔ رفرش حل‌شده تلقی نکنید. run `37632609344` و commit `97e488b`
رفع این مشکل را ثبت کرده‌اند.

## ۹. backup، بازگشت و پیش‌نیاز فروش واقعی

پیش از migration یا انتقال داده، یک dump معتبر و backup هماهنگ media تهیه
کنید. نمونهٔ dump روی سرور فعلی؛ خروجی در مسیر خصوصی خارج repo ذخیره می‌شود:

```sh
set -eu
umask 077
cd /opt/vt-shop
BACKUP_DIR=$(mktemp -d /tmp/vtshop-backup-XXXXXX)
docker compose --env-file .env.production -f compose.production.yaml --project-name vtshop exec -T db sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' </dev/null > "$BACKUP_DIR/database.dump"
test -s "$BACKUP_DIR/database.dump"
```

این دستور فقط DB را ذخیره می‌کند؛ خالی نبودن فایل اثبات امکان restore نیست.
media و env خصوصی را جداگانه و با دسترسی محدود پشتیبان بگیرید؛ برای DB/media
هماهنگ، نوشتن را متوقف کنید. `/tmp` محل نگهداری دائمی نیست: نسخه را به محل
خصوصی خارج VPS منتقل کنید و restore را در محیط جدا تمرین کنید.

rollback کد، rollback دیتابیس نیست. SHA سالم را ثبت کنید و برای بازگشت،
سازگاری آن با schema فعلی را بررسی کنید. workflow فعلی SHA همان run را
منتشر می‌کند و گزینهٔ انتخاب SHA دلخواه ندارد؛ تغییر را با یک revert بررسی‌شده
برگردانید یا اجرای دستیِ استقرار SHA مشخص را جداگانه آماده کنید. در خرابی
داده، backup را بدون تصمیم و برنامه روی DB زنده restore نکنید.

نسخهٔ فعلی یک پیش‌نمایش HTTP است. پیش از فروش واقعی: دامنه/TLS، ورود مدیر،
SMTP، تنظیم و بررسی واقعی زرین‌پال و backup خارج سرور لازم‌اند. Console email
برای مشتری ایمیل واقعی ارسال نمی‌کند؛ اجرا شدن سایت به معنی آماده بودن پرداخت نیست.

## ۱۰. متن آماده برای دستیار در استقرار بعدی

> ابتدا AGENTS.md، SESSION_STATE.md و راهنمای DEPLOYMENT_LESSONS_FA.md را
> بخوان. remote و شاخهٔ صحیح، سرور، پورت آزاد، مسیر برنامه، Environment و نام
> Compose را از اطلاعات تأییدشده مشخص کن. env و Compose لوکال را حفظ کن و
> تنظیمات production را جدا قرار بده. هیچ Secret یا backup را commit نکن.
> قبل از انتقال داده تعیین کن هدف نمونه، ورود Excel یا DB/media کامل است؛
> seed را در deploy معمول اجرا نکن. stdin دستورهای Docker داخل SSH را مهار
> کن، SHA دقیق را منتشر کن، سلامت چهار سرویس و CSS/JS/media/API را از بیرون
> بررسی کن و سپس اجرای لوکال را بررسی کن. موارد تست‌نشده را صریح ثبت کن.

برای پروژهٔ جدید، مقادیر بخش ۱ و ۴ و شیوهٔ انتقال دادهٔ بخش ۶ را همراه این
متن بدهید. این اطلاعات جلوی حدس زدن مقصد، پورت، محل Secret و کاتالوگ را می‌گیرد.
