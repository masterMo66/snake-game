# 🌐 DNS Configuration for moqi.chat

## Current DNS Records

Based on your current configuration:

```
moqi.chat → 185.199.110.153 (GitHub Pages IP)
```

## Required DNS Changes for Snake Game

### Option 1: Subdomain (Recommended)
Add a **CNAME record** for the snake game:

```
Type: CNAME
Name: snake
Value: masterMo66.github.io
TTL: 3600
```

**Result:** `snake.moqi.chat` → `masterMo66.github.io`

### Option 2: Path-based Routing (No DNS Changes)
Use the existing `moqi.chat` domain with a path:

1. Update `CNAME` file to just `moqi.chat`
2. Game will be available at: `https://moqi.chat/snake-game/`

### Option 3: Replace Existing Project
If `huangshantravel` is not in use, you can:

1. Update the existing GitHub Pages configuration
2. Point `moqi.chat` to the snake game repository
3. Game will be available at: `https://moqi.chat`

## 📋 Step-by-Step Guide (Tencent Cloud)

### For Option 1 (Subdomain):

1. **Log in to Tencent Cloud DNS**
   - Go to [DNSPod Console](https://console.dnspod.cn)
   - Select your domain: `moqi.chat`

2. **Add CNAME Record**
   - Click **Add Record**
   - Type: `CNAME`
   - Host: `snake`
   - Value: `masterMo66.github.io`
   - TTL: `600` (10 minutes) for testing, then `3600` (1 hour)

3. **Save and Wait**
   - Click **Save**
   - Wait 10-60 minutes for DNS propagation

4. **Verify DNS**
   ```bash
   dig snake.moqi.chat
   nslookup snake.moqi.chat
   ```

### For Option 3 (Replace Existing):

1. **Update GitHub Pages**
   - Go to `masterMo66/snake-game` repository
   - Settings → Pages
   - Custom domain: `moqi.chat`
   - Save

2. **Update DNS (if needed)**
   - Ensure `moqi.chat` has CNAME to `masterMo66.github.io`
   - Or keep existing A records pointing to GitHub Pages IPs

## 🔍 Verification Commands

```bash
# Check current DNS
dig moqi.chat
dig snake.moqi.chat
dig masterMo66.github.io

# Check GitHub Pages status
curl -I https://moqi.chat
curl -I https://snake.moqi.chat
```

## ⚠️ Important Notes

1. **DNS Propagation**: Changes can take 10 minutes to 24 hours
2. **HTTPS**: GitHub Pages automatically provides SSL certificates
3. **Conflict**: If `huangshantravel` is still using `moqi.chat`, Option 1 (subdomain) is safest
4. **Testing**: You can test locally by editing your `/etc/hosts` file:
   ```
   185.199.110.153 snake.moqi.chat
   ```

## 🚀 Quick Start (Recommended)

1. **Use Option 1** (subdomain) to avoid conflicts
2. Add CNAME record in Tencent Cloud
3. Update `CNAME` file in repository to `snake.moqi.chat`
4. Configure GitHub Pages with the custom domain
5. Wait for DNS + GitHub Pages deployment

## 📞 Support

If you need help:
1. Share your Tencent Cloud DNS configuration (screenshot)
2. Check GitHub Pages build status
3. Verify DNS propagation with `dig` commands