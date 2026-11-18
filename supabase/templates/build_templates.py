#!/usr/bin/env python3
"""Tạo mẫu email (tiếng Việt + dòng tiếng Anh) cho Supabase Auth → supabase/templates/*.html + subjects.json.
Dán vào: Supabase → Authentication → Emails → Templates (cần cài SMTP riêng trước).
    python3 supabase/templates/build_templates.py
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

LAYOUT = """<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#EEF5FB;font-family:Arial,Helvetica,sans-serif;color:#1F3A52">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF5FB;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 18px rgba(61,127,184,.15)">
<tr><td style="background:linear-gradient(135deg,#6FB1E4,#3D7FB8);background-color:#3D7FB8;padding:22px 28px;color:#ffffff">
  <div style="font-size:24px;font-weight:bold;letter-spacing:.5px">Personavel</div>
  <div style="font-size:12px;opacity:.9;margin-top:2px">YOUR TRIP · YOUR STORY</div>
</td></tr>
<tr><td style="padding:28px">
  <h1 style="margin:0 0 12px;font-size:20px;color:#2C5F8A">{title}</h1>
  {body}
  <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#5B7489">{note}</p>
  <hr style="border:none;border-top:1px solid #DCE8F2;margin:22px 0">
  <p style="margin:0;font-size:12px;line-height:1.6;color:#7A8FA0"><em>{en}</em></p>
</td></tr>
<tr><td style="background:#F5F9FD;padding:16px 28px;font-size:11px;line-height:1.6;color:#8A9BAA">
  Personavel – Bản đồ du lịch tự túc TP.HCM · <a href="https://personavel.github.io" style="color:#3D7FB8">personavel.github.io</a><br>
  Email tự động, vui lòng không trả lời. Automated email – please do not reply.
</td></tr>
</table></td></tr></table></body></html>
"""

def button(label):
    return ('<p style="margin:22px 0;text-align:center"><a href="{{ .ConfirmationURL }}" '
            'style="display:inline-block;background:#3D7FB8;color:#ffffff;text-decoration:none;font-weight:bold;'
            f'padding:13px 26px;border-radius:999px;font-size:15px">{label}</a></p>'
            '<p style="margin:0;font-size:12px;line-height:1.6;color:#7A8FA0">Nút không bấm được? Mở liên kết này:<br>'
            '<a href="{{ .ConfirmationURL }}" style="color:#3D7FB8;word-break:break-all">{{ .ConfirmationURL }}</a></p>')

def p(text):
    return f'<p style="margin:0 0 10px;font-size:15px;line-height:1.6">{text}</p>'

CODE = ('<p style="margin:18px 0;text-align:center"><span style="display:inline-block;font-size:28px;letter-spacing:6px;'
        'font-weight:bold;color:#2C5F8A;background:#EEF5FB;border-radius:12px;padding:12px 20px">{{ .Token }}</span></p>')

IGNORE = 'Nếu bạn không yêu cầu việc này, cứ bỏ qua email – tài khoản của bạn vẫn an toàn.'

T = {
  'confirmation': dict(
    subject='Xác nhận email để bắt đầu hành trình với Personavel',
    title='Chào mừng bạn đến với Personavel! 👋',
    body=p('Cảm ơn bạn đã đăng ký. Bấm nút bên dưới để xác nhận địa chỉ email <strong>{{ .Email }}</strong>.') + button('Xác nhận email'),
    note='Liên kết có hiệu lực trong 24 giờ. ' + IGNORE,
    en='Welcome to Personavel! Tap the button above to confirm your email address.'),
  'invite': dict(
    subject='Bạn được mời tham gia Personavel',
    title='Bạn có lời mời tham gia Personavel ✉️',
    body=p('Nhóm Personavel mời bạn tạo tài khoản để lưu lịch trình, nhật ký và đánh giá các địa điểm ở Sài Gòn.') + button('Nhận lời mời'),
    note=IGNORE,
    en="You've been invited to join Personavel. Tap the button above to accept."),
  'magic_link': dict(
    subject='Liên kết đăng nhập Personavel',
    title='Đăng nhập Personavel',
    body=p('Bấm nút bên dưới để đăng nhập, không cần mật khẩu.') + button('Đăng nhập') +
         p('<br>Hoặc nhập mã một lần:') + CODE,
    note='Liên kết và mã chỉ dùng được một lần, hết hạn sau 1 giờ. ' + IGNORE,
    en='Tap the button (or enter the one-time code) above to sign in to Personavel.'),
  'email_change': dict(
    subject='Xác nhận địa chỉ email mới cho Personavel',
    title='Xác nhận email mới',
    body=p('Bạn vừa yêu cầu đổi email tài khoản Personavel từ <strong>{{ .Email }}</strong> sang <strong>{{ .NewEmail }}</strong>.') +
         button('Xác nhận email mới'),
    note='Nếu bạn không yêu cầu đổi email, hãy bỏ qua thư này và đổi mật khẩu để bảo vệ tài khoản.',
    en='Confirm the change of your Personavel email address using the button above.'),
  'recovery': dict(
    subject='Đặt lại mật khẩu Personavel',
    title='Đặt lại mật khẩu 🔑',
    body=p('Chúng mình nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>{{ .Email }}</strong>. Bấm nút bên dưới để chọn mật khẩu mới.') +
         button('Đặt mật khẩu mới'),
    note='Liên kết hết hạn sau 1 giờ và chỉ dùng được một lần. ' + IGNORE,
    en='Tap the button above to choose a new Personavel password. If you did not ask for this, ignore this email.'),
  'reauthentication': dict(
    subject='Mã xác minh Personavel',
    title='Xác minh danh tính',
    body=p('Nhập mã dưới đây để tiếp tục thao tác quan trọng trên tài khoản của bạn:') + CODE,
    note='Mã hết hạn sau vài phút. Đừng chia sẻ mã này cho bất kỳ ai, kể cả người tự nhận là nhóm Personavel.',
    en='Enter the code above to confirm it is you. Never share this code.'),
}

if __name__ == '__main__':
    subjects = {}
    for key, t in T.items():
        (HERE / f'{key}.html').write_text(LAYOUT.format(**{k: t[k] for k in ('title', 'body', 'note', 'en')}), encoding='utf-8')
        subjects[key] = t['subject']
    (HERE / 'subjects.json').write_text(json.dumps(subjects, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('\n'.join(f'{k}: {v}' for k, v in subjects.items()))
