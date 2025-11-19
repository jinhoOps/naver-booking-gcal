// content.js

(function () {
  const isBookingDetailPage = () => {
    const url = window.location.href;
    return (
      url.includes("booking.naver.com/my/share/bookings/") ||
      url.includes("booking.naver.com/my/bookings/")
    );
  };

  if (!isBookingDetailPage()) {
    return;
  }

  const waitForElement = (selector, timeout = 10000) => {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) {
        resolve(el);
        return;
      }

      const observer = new MutationObserver(() => {
        const node = document.querySelector(selector);
        if (node) {
          observer.disconnect();
          resolve(node);
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error("Element not found: " + selector));
      }, timeout);
    });
  };

  const parseBookedDate = (text) => {
    if (!text) return null;

    const cleaned = text.replace(/\s+/g, " ").trim();
    const match = cleaned.match(
      /^(\d{4})\. (\d{1,2})\. (\d{1,2})\([^)]*\) (오전|오후) (\d{1,2}):(\d{2})$/
    );

    if (!match) {
      console.warn("예약 일시 파싱 실패:", text);
      return null;
    }

    const [, year, month, day, ampm, hourStr, minuteStr] = match;
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (ampm === "오후" && hour < 12) {
      hour += 12;
    }
    if (ampm === "오전" && hour === 12) {
      hour = 0;
    }

    const date = new Date();
    date.setFullYear(parseInt(year, 10));
    date.setMonth(parseInt(month, 10) - 1);
    date.setDate(parseInt(day, 10));
    date.setHours(hour, minute, 0, 0);

    return date;
  };

  const formatDateForGoogle = (date) => {
    const pad = (n) => n.toString().padStart(2, "0");
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = "00";
    return `${y}${m}${d}T${hh}${mm}${ss}`;
  };

  const buildGoogleCalendarUrl = (eventData) => {
    const {
      title,
      startDate,
      durationMinutes = 60,
      location,
      description,
    } = eventData;

    if (!startDate) {
      console.warn("startDate 없음, Google Calendar URL 생성 불가");
      return null;
    }

    const start = startDate;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const startStr = formatDateForGoogle(start);
    const endStr = formatDateForGoogle(end);

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title || "",
      dates: `${startStr}/${endStr}`,
      location: location || "",
      details: description || "",
      ctz: "Asia/Seoul",
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const truncateForDisplay = (str, maxLength = 30) => {
    if (!str) return "";
    return str.length <= maxLength ? str : str.slice(0, maxLength) + "...";
  };

  const extractReservationInfo = () => {
    const storeEl = document.querySelector(
      ".BizItemHeader__title__vN3fX .BizItemHeader__text__1Ouye"
    );
    const storeName = storeEl ? storeEl.textContent.trim() : "";

    const staffAnchor = document.querySelector(
      ".confirm_item_top h4.tit .anchor"
    );
    const staffName = staffAnchor ? staffAnchor.textContent.trim() : "";

    let menuText = "";
    const infoItems = document.querySelectorAll(".detail_info .info_lst .info_item");
    infoItems.forEach((item) => {
      const tit = item.querySelector(".item_tit");
      const desc = item.querySelector(".item_desc");
      if (!tit || !desc) return;
      if (tit.textContent.replace(/\s+/g, "").includes("메뉴")) {
        menuText = desc.textContent.trim();
      }
    });

    const bookedSpan = document.querySelector(".detail_info .booked_date");
    const bookedText = bookedSpan ? bookedSpan.textContent.trim() : "";
    const startDate = parseBookedDate(bookedText);

    const addressBox = document.querySelector(".address_text");
    let address = "";
    if (addressBox) {
      address = addressBox.textContent
        .replace("지번", "")
        .replace("복사", "")
        .trim();
    }

    const originalUrl = window.location.href.split("#")[0];
    const shortUrlDisplay = truncateForDisplay(originalUrl, 30);

    let title = "";
    if (storeName && staffName && menuText) {
      title = `${storeName} - ${staffName} (${menuText})`;
    } else if (storeName && staffName) {
      title = `${storeName} - ${staffName}`;
    } else {
      title = storeName || staffName || "네이버 예약";
    }

    const descriptionLines = [];
    if (bookedText) descriptionLines.push(`예약 일시: ${bookedText}`);
    if (menuText) descriptionLines.push(`메뉴: ${menuText}`);
    if (staffName) descriptionLines.push(`담당자: ${staffName}`);
    if (originalUrl) {
      descriptionLines.push("");
      descriptionLines.push(`원본 예약 링크: ${originalUrl}`);
    }

    const description = descriptionLines.join("\n");

    return {
      storeName,
      staffName,
      menuText,
      bookedText,
      startDate,
      address,
      originalUrl,
      shortUrlDisplay,
      title,
      description,
    };
  };

  const createOverlay = (eventInfo, onConfirm, onCancel) => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.backgroundColor = "rgba(0,0,0,0.35)";
    overlay.style.zIndex = "99999";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    const modal = document.createElement("div");
    modal.style.width = "360px";
    modal.style.maxWidth = "90%";
    modal.style.backgroundColor = "#fff";
    modal.style.borderRadius = "12px";
    modal.style.boxShadow = "0 8px 24px rgba(0,0,0,0.18)";
    modal.style.padding = "16px 18px 12px";
    modal.style.fontFamily =
      "-apple-system,BlinkMacSystemFont,system-ui,Roboto,'Noto Sans KR',sans-serif";
    modal.style.fontSize = "13px";

    const titleEl = document.createElement("div");
    titleEl.textContent = "Google 캘린더에 추가";
    titleEl.style.fontWeight = "600";
    titleEl.style.marginBottom = "8px";

    const field = (label, value) => {
      if (!value) return null;
      const wrap = document.createElement("div");
      wrap.style.marginBottom = "6px";

      const lab = document.createElement("div");
      lab.textContent = label;
      lab.style.fontSize = "11px";
      lab.style.color = "#666";

      const val = document.createElement("div");
      val.textContent = value;
      val.style.fontSize = "13px";
      val.style.color = "#111";

      wrap.appendChild(lab);
      wrap.appendChild(val);
      return wrap;
    };

    const titleField = field("제목", eventInfo.title);
    const timeField = field("일시", eventInfo.bookedText);
    const placeField = field("장소", eventInfo.address || eventInfo.storeName);
    const linkField = field(
      "원본 링크",
      eventInfo.shortUrlDisplay || eventInfo.originalUrl
    );

    const body = document.createElement("div");
    if (titleField) body.appendChild(titleField);
    if (timeField) body.appendChild(timeField);
    if (placeField) body.appendChild(placeField);
    if (linkField) body.appendChild(linkField);
    body.style.marginBottom = "12px";

    const btnRow = document.createElement("div");
    btnRow.style.display = "flex";
    btnRow.style.justifyContent = "flex-end";
    btnRow.style.gap = "10px";
    btnRow.style.marginTop = "6px";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "취소";
    cancelBtn.style.border = "none";
    cancelBtn.style.background = "transparent";
    cancelBtn.style.padding = "6px 10px";
    cancelBtn.style.cursor = "pointer";
    cancelBtn.style.color = "#666";
    cancelBtn.onclick = () => {
      onCancel && onCancel();
      document.body.removeChild(overlay);
    };

    const okBtn = document.createElement("button");
    okBtn.textContent = "추가";
    okBtn.style.border = "none";
    okBtn.style.background = "#4A7CFF";
    okBtn.style.color = "#fff";
    okBtn.style.padding = "6px 14px";
    okBtn.style.borderRadius = "8px";
    okBtn.style.cursor = "pointer";
    okBtn.style.fontWeight = "500";
    okBtn.onclick = () => {
      onConfirm && onConfirm();
      document.body.removeChild(overlay);
    };

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(okBtn);

    modal.appendChild(titleEl);
    modal.appendChild(body);
    modal.appendChild(btnRow);
    overlay.appendChild(modal);

    return overlay;
  };

  const injectFloatingButton = () => {
    if (document.getElementById("naver-booking-gcal-button")) {
      return;
    }

    const btn = document.createElement("button");
    btn.id = "naver-booking-gcal-button";
    // btn.textContent = "캘린더 추가";    btn.textContent = "캘린더 추가";
    btn.textContent = "📅";
    btn.style.position = "fixed";
    btn.style.right = "16px";
    btn.style.bottom = "16px";
    btn.style.zIndex = "99998";
    btn.style.border = "none";
    btn.style.borderRadius = "999px";
    btn.style.padding = "10px 16px";
    btn.style.fontSize = "13px";
    btn.style.fontFamily =
      "-apple-system,BlinkMacSystemFont,system-ui,Roboto,'Noto Sans KR',sans-serif";
    btn.style.background = "#4A7CFF";
    btn.style.color = "#fff";
    btn.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
    btn.style.cursor = "pointer";
    btn.style.transition = "background-color 0.15s ease";
    btn.style.opacity = "0.98";

    btn.addEventListener("mouseenter", () => {
      btn.style.background = "#3B6BE5"; // hover
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "#4A7CFF";
    });

    btn.onclick = () => {
      const info = extractReservationInfo();

      if (!info.startDate) {
        alert("예약 일시를 찾지 못했습니다. 페이지 구조가 바뀌었을 수 있습니다.");
        return;
      }

      const overlay = createOverlay(
        info,
        () => {
          const url = buildGoogleCalendarUrl({
            title: info.title,
            startDate: info.startDate,
            durationMinutes: 60,
            location: info.address || info.storeName,
            description: info.description,
          });

          if (url) {
            window.open(url, "_blank");
          } else {
            alert("Google 캘린더 링크 생성에 실패했습니다.");
          }
        },
        () => {}
      );

      document.body.appendChild(overlay);
    };

    document.body.appendChild(btn);
  };

  const init = async () => {
    try {
      await waitForElement(".confirm_item_top");
      injectFloatingButton();
    } catch (e) {
      console.warn("네이버 예약 페이지 초기화 실패:", e);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
