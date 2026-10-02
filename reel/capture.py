"""Drives Folio on an emulator over adb and saves real screenshots and screen recordings for the promo reel."""
import os, re, subprocess, sys, time
import xml.etree.ElementTree as ET

OUT = sys.argv[1] if len(sys.argv) > 1 else "shots"
os.makedirs(OUT, exist_ok=True)
PKG = "com.folio.cv"


def adb(*args, check=False, capture=False):
    r = subprocess.run(["adb", *args], capture_output=True, text=not capture)
    if check and r.returncode != 0:
        raise RuntimeError(f"adb {args}: {r.stderr}")
    return r.stdout


def sh(cmd):
    return adb("shell", cmd)


def shot(name):
    data = subprocess.run(["adb", "exec-out", "screencap", "-p"], capture_output=True).stdout
    with open(f"{OUT}/{name}.png", "wb") as f:
        f.write(data)
    print("shot", name, len(data), flush=True)


def dump():
    for _ in range(5):
        sh("uiautomator dump /sdcard/ui.xml >/dev/null 2>&1")
        xml = adb("exec-out", "cat", "/sdcard/ui.xml")
        if xml.strip().startswith("<?xml"):
            try:
                return ET.fromstring(xml)
            except ET.ParseError:
                pass
        time.sleep(1)
    return None


def find(label, attr="text", exact=True, timeout=20):
    end = time.time() + timeout
    while time.time() < end:
        root = dump()
        if root is not None:
            for n in root.iter("node"):
                v = n.get(attr, "")
                if (v == label) if exact else (label in v):
                    x1, y1, x2, y2 = map(int, re.findall(r"\d+", n.get("bounds")))
                    return (x1 + x2) // 2, (y1 + y2) // 2
        time.sleep(1)
    raise RuntimeError(f"not found: {label}")


def tap(label, **kw):
    x, y = find(label, **kw)
    sh(f"input tap {x} {y}")
    print("tap", label, x, y, flush=True)


def back():
    sh("input keyevent KEYCODE_BACK")


def swipe(x1, y1, x2, y2, ms=350):
    sh(f"input swipe {x1} {y1} {x2} {y2} {ms}")


class Recording:
    def __init__(self, name):
        self.name = name

    def __enter__(self):
        self.p = subprocess.Popen(["adb", "shell", f"screenrecord --bit-rate 12000000 /sdcard/{self.name}.mp4"])
        time.sleep(1.5)
        return self

    def __exit__(self, *a):
        sh("pkill -INT screenrecord")
        self.p.wait(timeout=30)
        time.sleep(2)
        adb("pull", f"/sdcard/{self.name}.mp4", f"{OUT}/{self.name}.mp4")
        print("recorded", self.name, flush=True)


def step(fn):
    try:
        fn()
    except Exception as e:  # keep going so one missed tap doesn't lose the rest
        print("STEP FAILED", fn.__name__, e, flush=True)
        root = dump()
        if root is not None:
            with open(f"{OUT}/fail_{fn.__name__}.xml", "wb") as f:
                f.write(ET.tostring(root))
        shot(f"fail_{fn.__name__}")


W, H = map(int, re.findall(r"(\d+)x(\d+)", sh("wm size"))[-1])
print("screen", W, H, flush=True)

# Clean status bar: 9:41, full battery and signal, no notifications.
sh("settings put global sysui_demo_allowed 1")
for c in [
    "-e command enter",
    "-e command clock -e hhmm 0941",
    "-e command battery -e level 100 -e plugged false",
    "-e command network -e wifi show -e level 4 -e mobile show -e datatype none -e level 4",
    "-e command notifications -e visible false",
]:
    sh(f"am broadcast -a com.android.systemui.demo {c}")
sh("settings put global window_animation_scale 1")
sh("settings put global transition_animation_scale 1")
sh("settings put global animator_duration_scale 1")
sh(f"pm clear {PKG}")
time.sleep(1)


def welcome():
    with Recording("rec_welcome"):
        sh(f"am start -W -n {PKG}/.MainActivity")
        time.sleep(4)
    shot("01_welcome")


def new_sheet():
    tap("Create your CV")
    time.sleep(2.5)
    shot("02_new_sheet")


def editor():
    with Recording("rec_editor"):
        tap("Mechanical engineer")
        time.sleep(3)
        shot("03_editor_outline")
        swipe(W // 2, H * 3 // 4, W // 2, H // 4, 600)
        time.sleep(1.5)
        shot("04_editor_outline_scrolled")
        swipe(W // 2, H // 4, W // 2, H * 3 // 4, 600)
        time.sleep(1.5)
        tap("Experience")
        time.sleep(2.5)
    shot("05_experience")


def entry():
    root = dump()
    # Open the first experience entry: the first clickable card under the top bar.
    texts = [n for n in root.iter("node") if n.get("text")]
    print("experience texts", [t.get("text") for t in texts][:20], flush=True)
    target = texts[1] if len(texts) > 1 else texts[0]
    x1, y1, x2, y2 = map(int, re.findall(r"\d+", target.get("bounds")))
    sh(f"input tap {(x1 + x2) // 2} {(y1 + y2) // 2}")
    time.sleep(2.5)
    shot("06_entry")
    swipe(W // 2, H * 3 // 4, W // 2, H // 3, 600)
    time.sleep(1.5)
    shot("07_entry_bullets")
    back()
    time.sleep(1.5)
    back()
    time.sleep(2)


def personal():
    tap("Personal details", exact=False)
    time.sleep(2.5)
    shot("08_personal")
    back()
    time.sleep(2)


def templates():
    swipe(W // 2, H * 3 // 4, W // 2, H // 4, 400)
    time.sleep(1)
    swipe(W // 2, H * 3 // 4, W // 2, H // 4, 400)
    time.sleep(1.5)
    with Recording("rec_templates"):
        tap("Change")
        time.sleep(3)
        shot("10_templates")
        for i in range(6):
            swipe(W * 4 // 5, H // 2, W // 5, H // 2, 300)
            time.sleep(1.8)
            shot(f"11_template_{i}")
    try:
        tap("All")
    except Exception:
        pass


def template_categories():
    for label in ["Engineering", "Creative", "Executive", "Modern", "Classic", "Minimal"]:
        try:
            x, y = find(label, timeout=3)
        except Exception:
            continue
        sh(f"input tap {x} {y}")
        time.sleep(2.5)
        shot(f"12_category_{label.lower()}")
        swipe(W * 4 // 5, H // 2, W // 5, H // 2, 300)
        time.sleep(1.8)
        shot(f"12_category_{label.lower()}_b")
    back()
    time.sleep(2)


def preview():
    swipe(W // 2, H // 4, W // 2, H * 3 // 4, 400)
    time.sleep(1)
    swipe(W // 2, H // 4, W // 2, H * 3 // 4, 400)
    time.sleep(1)
    with Recording("rec_preview"):
        tap("Preview & export")
        time.sleep(4)
        shot("20_preview")
        swipe(W // 2, H * 3 // 4, W // 2, H // 3, 900)
        time.sleep(2)
        shot("21_preview_scrolled")
        swipe(W // 2, H // 3, W // 2, H * 3 // 4, 900)
        time.sleep(2)


def zoom():
    sh(f"input tap {W // 2} {H // 2}")
    time.sleep(0.08)
    sh(f"input tap {W // 2} {H // 2}")
    time.sleep(2)
    shot("22_preview_zoom")
    sh(f"input tap {W // 2} {H // 2}")
    time.sleep(0.08)
    sh(f"input tap {W // 2} {H // 2}")
    time.sleep(2)


def check():
    tap("CV check", exact=False)
    time.sleep(2.5)
    shot("23_cv_check")
    swipe(W // 2, H * 3 // 4, W // 2, H // 3, 600)
    time.sleep(1.5)
    shot("24_cv_check_scrolled")
    back()
    time.sleep(2)


def style():
    tap("Style", attr="content-desc")
    time.sleep(2.5)
    shot("25_style")
    # Try a different accent so the preview changes colour.
    try:
        tap("Accent 3", attr="content-desc", timeout=5)
        time.sleep(2)
        shot("26_style_accent")
    except Exception as e:
        print("accent", e)
    back()
    time.sleep(2.5)
    shot("27_preview_accent")


def export():
    tap("Export")
    time.sleep(2.5)
    shot("28_export")
    back()
    time.sleep(2)


def home():
    back()
    time.sleep(2)
    back()
    time.sleep(3)
    shot("30_home")


def dark():
    sh("cmd uimode night yes")
    time.sleep(3)
    shot("31_home_dark")
    try:
        tap("Mechanical Engineer CV", exact=False)
        time.sleep(3)
        shot("32_editor_dark")
        tap("Preview & export")
        time.sleep(4)
        shot("33_preview_dark")
    except Exception as e:
        print("dark", e)
    sh("cmd uimode night no")


for fn in [welcome, new_sheet, editor, entry, personal, templates, template_categories, preview, zoom, check, style, export, home, dark]:
    step(fn)

print("done", sorted(os.listdir(OUT)), flush=True)
