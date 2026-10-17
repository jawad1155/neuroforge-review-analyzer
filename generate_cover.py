import math
import random
from PIL import Image, ImageDraw, ImageFont

def generate_cover_image(output_path="cover_image.png"):
    W, H = 1920, 1080
    img = Image.new("RGBA", (W, H), (7, 10, 18, 255))
    draw = ImageDraw.Draw(img)

    # 1. Base Gradient Background
    for y in range(H):
        ratio = y / H
        r = int(7 + ratio * 12)
        g = int(10 + ratio * 15)
        b = int(18 + ratio * 28)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # 2. Glowing Ambient Orbs (Soft radial glows)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(overlay)

    def draw_glow(center_x, center_y, max_r, color_rgb, max_alpha=50):
        for radius in range(max_r, 0, -8):
            alpha = int(max_alpha * (1 - radius / max_r) ** 1.8)
            glow_draw.ellipse(
                [(center_x - radius, center_y - radius), (center_x + radius, center_y + radius)],
                fill=(color_rgb[0], color_rgb[1], color_rgb[2], alpha)
            )

    # Top-right Cyan Glow
    draw_glow(1550, 280, 520, (0, 240, 255), max_alpha=40)
    # Bottom-left AMD Crimson Glow
    draw_glow(250, 900, 600, (237, 28, 36), max_alpha=35)
    # Center Sky Glow
    draw_glow(1050, 650, 480, (56, 189, 248), max_alpha=28)

    img = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(img)

    # 3. Neural Synapse Constellation Grid
    random.seed(42)
    nodes = []
    for _ in range(45):
        nx = random.randint(850, 1880)
        ny = random.randint(80, 1000)
        nodes.append((nx, ny))

    # Draw Synaptic Lines between nearby nodes
    synapse_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    syn_draw = ImageDraw.Draw(synapse_layer)
    for i in range(len(nodes)):
        for j in range(i + 1, len(nodes)):
            x1, y1 = nodes[i]
            x2, y2 = nodes[j]
            dist = math.hypot(x2 - x1, y2 - y1)
            if dist < 220:
                alpha = int(90 * (1 - dist / 220))
                syn_draw.line([(x1, y1), (x2, y2)], fill=(56, 189, 248, alpha), width=1)

    # Draw Nodes
    for nx, ny in nodes:
        rad = random.randint(3, 6)
        c = random.choice([(0, 240, 255), (255, 255, 255), (56, 189, 248), (237, 28, 36)])
        syn_draw.ellipse([(nx - rad, ny - rad), (nx + rad, ny + rad)], fill=(c[0], c[1], c[2], 220))

    img = Image.alpha_composite(img, synapse_layer)
    draw = ImageDraw.Draw(img)

    # Load Windows System Fonts
    font_dir = "C:/Windows/Fonts"
    try:
        font_title = ImageFont.truetype(f"{font_dir}/segoeuib.ttf", 88)
        font_tagline = ImageFont.truetype(f"{font_dir}/segoeuib.ttf", 34)
        font_sub = ImageFont.truetype(f"{font_dir}/segoeui.ttf", 22)
        font_badge = ImageFont.truetype(f"{font_dir}/segoeuib.ttf", 15)
        font_card_h = ImageFont.truetype(f"{font_dir}/segoeuib.ttf", 24)
        font_card_p = ImageFont.truetype(f"{font_dir}/segoeui.ttf", 16)
        font_stat = ImageFont.truetype(f"{font_dir}/segoeuib.ttf", 52)
        font_footer = ImageFont.truetype(f"{font_dir}/segoeuib.ttf", 18)
    except Exception:
        font_title = ImageFont.load_default()
        font_tagline = ImageFont.load_default()
        font_sub = font_badge = font_card_h = font_card_p = font_stat = font_footer = font_title

    def draw_badge(x, y, w, h, text, bg_rgba, text_rgb, border_rgba=None):
        badge_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        b_draw = ImageDraw.Draw(badge_layer)
        b_draw.rounded_rectangle([x, y, x + w, y + h], radius=h // 2, fill=bg_rgba, outline=border_rgba, width=1)
        bbox = b_draw.textbbox((0, 0), text, font=font_badge)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        b_draw.text((x + (w - tw) // 2, y + (h - th) // 2 - 2), text, font=font_badge, fill=text_rgb)
        return badge_layer

    # 4. Top Badges
    img = Image.alpha_composite(img, draw_badge(100, 100, 370, 42, "AMD DEVELOPER HACKATHON: ACT III", (237, 28, 36, 45), (255, 90, 95), (237, 28, 36, 120)))
    img = Image.alpha_composite(img, draw_badge(490, 100, 310, 42, "EVOLUS AI WORKSPACE PARTNER", (0, 240, 255, 30), (0, 240, 255), (0, 240, 255, 100)))
    img = Image.alpha_composite(img, draw_badge(820, 100, 290, 42, "AMD ROCm™ GPU ACCELERATED", (16, 185, 129, 30), (52, 211, 153), (16, 185, 129, 100)))
    draw = ImageDraw.Draw(img)

    # 5. Brand Logo Mark + Main Title
    # Draw Geometric Neural Diamond Icon
    icon_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    i_draw = ImageDraw.Draw(icon_layer)
    cx, cy = 145, 235
    i_draw.rounded_rectangle([cx - 45, cy - 45, cx + 45, cy + 45], radius=18, fill=(15, 23, 42, 240), outline=(0, 240, 255, 180), width=2)
    # Diamond inside icon
    i_draw.polygon([(cx, cy - 26), (cx + 26, cy), (cx, cy + 26), (cx - 26, cy)], outline=(56, 189, 248, 230), width=2)
    i_draw.ellipse([(cx - 7, cy - 7), (cx + 7, cy + 7)], fill=(0, 240, 255, 255))
    i_draw.ellipse([(cx - 26 - 3, cy - 3), (cx - 26 + 3, cy + 3)], fill=(255, 255, 255, 255))
    i_draw.ellipse([(cx + 26 - 3, cy - 3), (cx + 26 + 3, cy + 3)], fill=(255, 255, 255, 255))
    i_draw.ellipse([(cx - 3, cy - 26 - 3), (cx + 3, cy - 26 + 3)], fill=(237, 28, 36, 255))
    i_draw.ellipse([(cx - 3, cy + 26 - 3), (cx + 3, cy + 26 + 3)], fill=(237, 28, 36, 255))
    img = Image.alpha_composite(img, icon_layer)
    draw = ImageDraw.Draw(img)

    # Title text
    draw.text((215, 185), "NEUROFORGE", font=font_title, fill=(255, 255, 255))
    draw.text((790, 185), "AI", font=font_title, fill=(0, 240, 255))

    # Tagline
    draw.text((100, 310), "AI-Powered Customer Review Intelligence Platform", font=font_tagline, fill=(248, 250, 252))

    # Description Paragraph
    desc_lines = [
        "Transforming thousands of raw, unstructured customer reviews into real-time sentiment distribution,",
        "root friction points, customer praise clusters, and actionable business strategy at hardware speed.",
        "Built on AMD Developer Cloud (DeepSeek-V4-Flash) with Evolus AI autonomous agent workflows."
    ]
    cur_y = 380
    for line in desc_lines:
        draw.text((100, cur_y), line, font=font_sub, fill=(148, 163, 184))
        cur_y += 36

    # 6. Floating Glassmorphic Feature Cards (Right Side & Center Grid)
    card_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(card_layer)

    def draw_glass_card(x, y, w, h, title, stat_val, stat_label, body_lines, accent_color):
        c_draw.rounded_rectangle([x, y, x + w, y + h], radius=16, fill=(18, 25, 41, 210), outline=(38, 52, 82, 230), width=1)
        # Accent top indicator bar
        c_draw.rounded_rectangle([x + 24, y, x + 90, y + 4], radius=2, fill=accent_color)
        # Title
        c_draw.text((x + 24, y + 24), title, font=font_card_h, fill=(248, 250, 252))
        # Stat
        if stat_val:
            c_draw.text((x + 24, y + 62), stat_val, font=font_stat, fill=accent_color)
            c_draw.text((x + 24, y + 128), stat_label, font=font_card_p, fill=(148, 163, 184))
        # Body Lines
        by = y + 165 if stat_val else y + 70
        for b_line in body_lines:
            c_draw.text((x + 24, by), f"• {b_line}", font=font_card_p, fill=(203, 213, 225))
            by += 28

    # Card 1: Benchmark & Speed
    draw_glass_card(
        100, 560, 480, 340,
        "AMD ROCm Hardware Acceleration",
        "10.3x", "Inference Speedup over Cloud CPU",
        [
            "1,000 reviews analyzed in 8.2 seconds",
            "50-review micro-batching pipelines",
            "DeepSeek-V4-Flash deterministic JSON mode"
        ],
        (0, 240, 255)
    )

    # Card 2: Evolus AI Agents
    draw_glass_card(
        610, 560, 480, 340,
        "Evolus AI Agent Orchestration",
        "100%", "Automated Workflow Intelligence",
        [
            "Review Insight Analyst autonomous agent",
            "Customer knowledge library RAG indexing",
            "Live verification routes at /evolus/info"
        ],
        (56, 189, 248)
    )

    # Card 3: Business Impact & Product UX
    draw_glass_card(
        1120, 560, 700, 340,
        "Executive Review Intelligence & ROI",
        "$120K+", "Annual CX Operations Cost Savings",
        [
            "Interactive SVG sentiment radial & distribution spectrum",
            "Grounded conversational 'Ask AI' customer Q&A copilot",
            "Proactive churn prevention with authenticated HMAC Webhooks",
            "1-click Executive Markdown & structured JSON report download"
        ],
        (16, 185, 129)
    )

    img = Image.alpha_composite(img, card_layer)
    draw = ImageDraw.Draw(img)

    # 7. Bottom Showcase Banner
    foot_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    f_draw = ImageDraw.Draw(foot_layer)
    f_draw.rounded_rectangle([100, 940, 1820, 1000], radius=14, fill=(15, 23, 42, 230), outline=(30, 41, 59, 220), width=1)
    
    # Left: Live Deployment Link
    f_draw.text((130, 958), "🌐 Live Application:", font=font_footer, fill=(56, 189, 248))
    f_draw.text((320, 958), "neuroforge-review-analyzer.vercel.app", font=font_footer, fill=(255, 255, 255))
    
    # Center: GitHub
    f_draw.text((820, 958), "📦 GitHub:", font=font_footer, fill=(0, 240, 255))
    f_draw.text((920, 958), "github.com/jawad1155/neuroforge-review-analyzer", font=font_footer, fill=(255, 255, 255))
    
    # Right: Team Credits
    f_draw.text((1440, 958), "👥 Team: Jawad & Arham Sohail", font=font_footer, fill=(148, 163, 184))

    img = Image.alpha_composite(img, foot_layer)

    # Save to disk
    img.convert("RGB").save(output_path, "PNG", quality=95)
    print(f"Cover image created successfully at: {output_path}")

if __name__ == "__main__":
    generate_cover_image()
