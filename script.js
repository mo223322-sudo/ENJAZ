// ======================================
// إعدادات Supabase
// ======================================

const SUPABASE_URL = "https://cubmgouyigiwkmyhlqtt.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_K6mPI6rlRNlqBpPpDjbcBA_gulm6U4g";

let db = null;

if (window.supabase &&
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_KEY !== "sb_publishable_K6mPI6rlRNlqBpPpDjbcBA_gulm6U4g" &&
    SUPABASE_URL !== "https://cubmgouyigiwkmyhlqtt.supabase.co/rest/v1/") {

    db = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );
}

// ======================================
// رقم واتساب
// ======================================

const WHATSAPP_NUMBER = "967717171998";

// ======================================
// إرسال طلب الخدمة إلى واتساب
// ======================================

const orderForm = document.getElementById("orderForm");

if (orderForm) {
    orderForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = document.getElementById("orderName").value.trim();
        const service = document.getElementById("serviceType").value;
        const details = document.getElementById("orderDetails").value.trim();

        const message =
            "مرحباً، أريد طلب خدمة من إنجاز:\n\n" +
            "الاسم: " + name + "\n" +
            "الخدمة: " + service + "\n" +
            "التفاصيل: " + details;

        const whatsappURL =
            "https://wa.me/" + WHATSAPP_NUMBER +
            "?text=" + encodeURIComponent(message);

        window.location.href = whatsappURL;
    });
}

// ======================================
// رابط واتساب العائم
// ======================================

const whatsappLink = document.getElementById("whatsappLink");

if (whatsappLink) {
    whatsappLink.href = "https://wa.me/" + WHATSAPP_NUMBER;
}

// ======================================
// إرسال تقييم العميل
// ======================================

const reviewForm = document.getElementById("reviewForm");
const reviewMessage = document.getElementById("reviewMessage");
const reviewButton = document.getElementById("reviewButton");

if (reviewForm) {
    reviewForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        if (!db) {
            reviewMessage.textContent =
                "قاعدة البيانات غير متصلة. تحقق من رابط المشروع والمفتاح العام.";
            return;
        }

        const enteredName =
            document.getElementById("customerName").value.trim();

        const showName =
            document.getElementById("showName").checked;

        const rating =
            Number(document.getElementById("rating").value);

        const reviewText =
            document.getElementById("reviewText").value.trim();

        if (!rating || rating < 1 || rating > 5 || !reviewText) {
            reviewMessage.textContent =
                "يرجى اختيار التقييم وكتابة رأيك.";
            return;
        }

        if (showName && !enteredName) {
            reviewMessage.textContent =
                "اكتب اسمك أو ألغِ خيار إظهار الاسم.";
            return;
        }

        reviewButton.disabled = true;
        reviewButton.textContent = "جارٍ إرسال التقييم...";

        try {
            const { error } = await db
                .from("reviews")
                .insert([{
                    customer_name: showName ? enteredName : null,
                    show_name: showName,
                    rating: rating,
                    review_text: reviewText,
                    status: "pending"
                }]);

            if (error) {
                throw error;
            }

            reviewMessage.textContent =
                "شكراً لك! وصل تقييمك وسيظهر بعد المراجعة والموافقة عليه.";

            reviewForm.reset();

        } catch (error) {
            console.error("Review error:", error);

            reviewMessage.textContent =
                "تعذر إرسال التقييم. تحقق من الاتصال وحاول مرة أخرى.";

        } finally {
            reviewButton.disabled = false;
            reviewButton.textContent = "إرسال التقييم";
        }
    });
}

// ======================================
// عرض التقييمات المعتمدة
// ======================================

async function loadReviews() {
    const reviewsList = document.getElementById("reviewsList");
    const averageRating = document.getElementById("averageRating");
    const totalReviews = document.getElementById("totalReviews");

    if (!reviewsList || !averageRating || !totalReviews) {
        return;
    }

    if (!db) {
        reviewsList.textContent =
            "تعذر الاتصال بقاعدة البيانات حاليًا.";
        return;
    }

    try {
        const { data, error } = await db
            .from("reviews")
            .select("customer_name, show_name, rating, review_text, created_at")
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        reviewsList.innerHTML = "";

        if (!data || data.length === 0) {
            reviewsList.textContent =
                "لا توجد تقييمات منشورة حتى الآن.";

            averageRating.textContent = "0.0 / 5";
            totalReviews.textContent = "لا توجد تقييمات بعد";
            return;
        }

        const total = data.reduce(function(sum, review) {
            return sum + review.rating;
        }, 0);

        const average = total / data.length;

        averageRating.textContent = average.toFixed(1) + " / 5";
        totalReviews.textContent = data.length + " تقييم";

        data.forEach(function(review) {
            const card = document.createElement("div");
            card.className = "review-card";

            const name = document.createElement("h4");
            name.textContent =
                review.show_name && review.customer_name
                    ? review.customer_name
                    : "عميل مجهول";

            const stars = document.createElement("p");
            stars.className = "review-stars";
            stars.textContent = "⭐".repeat(review.rating);

            const comment = document.createElement("p");
            comment.textContent = review.review_text;

            card.appendChild(name);
            card.appendChild(stars);
            card.appendChild(comment);

            reviewsList.appendChild(card);
        });

    } catch (error) {
        console.error("Loading reviews error:", error);
        reviewsList.textContent =
            "حدث خطأ أثناء تحميل التقييمات.";
    }
}

// تحميل التقييمات عند فتح الموقع
loadReviews();