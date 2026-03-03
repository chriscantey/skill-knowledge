---
id: certbot-renewal
title: Certbot Certificate Renewal
tags: [ssl, certbot, letsencrypt, certs]
category: tech
created: 2026-02-15
source: manual
---

# Certbot Certificate Renewal

## Summary

How to renew Let's Encrypt certificates with certbot. Renewal is usually automatic via cron/systemd, but here's how to do it manually and verify.

## Details

### Check Expiry

```bash
sudo certbot certificates
```

Shows all managed certificates and their expiry dates.

### Manual Renewal

```bash
sudo certbot renew
```

Renews all certificates within 30 days of expiry. Add `--dry-run` to test without actually renewing.

### Force Renewal

```bash
sudo certbot renew --force-renewal
```

Renews even if not near expiry. Use when you need fresh certs immediately.

### Standalone Mode (no web server running)

If your web server needs to be stopped to free port 80:

```bash
sudo systemctl stop nginx
sudo certbot renew --standalone
sudo systemctl start nginx
```

### Verify After Renewal

```bash
openssl x509 -noout -dates -in /etc/letsencrypt/live/yourdomain.com/cert.pem
```

### Automatic Renewal

Check if the systemd timer is active:

```bash
systemctl status certbot.timer
```

Or if using cron:

```bash
sudo crontab -l | grep certbot
```

Certbot adds `0 0,12 * * * certbot renew --quiet` by default.
