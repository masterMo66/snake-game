# ⚙️ Manual GitHub Pages Setup

Since the GitHub API failed to enable Pages automatically, here are the manual steps:

## Step 1: Enable GitHub Pages

1. Go to: `https://github.com/masterMo66/snake-game`
2. Click **Settings** (gear icon)
3. Scroll down to **Pages** section on the left sidebar
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**

## Step 2: Wait for Deployment

GitHub Pages will automatically:
1. Build and deploy your site
2. Generate a URL: `https://masterMo66.github.io/snake-game`
3. This usually takes 1-2 minutes

## Step 3: Verify Deployment

Check if your site is live:
```bash
curl -I https://masterMo66.github.io/snake-game
```

Expected response: `HTTP/2 200`

## Step 4: (Optional) Add Custom Domain

Once you've configured DNS in Tencent Cloud:

1. In GitHub Pages settings, add your custom domain:
   - For subdomain: `snake.moqi.chat`
   - For main domain: `moqi.chat`

2. Check **Enforce HTTPS**

3. GitHub will verify the domain and provision SSL certificate

## 📊 Current Status

| Component | Status | Action Needed |
|-----------|--------|---------------|
| Repository | ✅ Ready | - |
| GitHub Pages | ⚠️ Manual setup | Enable in Settings |
| Game Code | ✅ Deployed | - |
| Custom Domain | 🔄 Pending | Configure DNS first |

## 🚨 Troubleshooting

### GitHub Pages not showing
- Ensure `index.html` is in root directory
- Check GitHub Actions for build errors
- Verify branch is `main`

### 404 Error
- Wait a few more minutes for deployment
- Clear browser cache
- Try incognito mode

### Custom domain not working
- DNS must propagate (10-60 minutes)
- CNAME record must point to `masterMo66.github.io`
- GitHub must verify domain ownership

## 🔗 Quick Links

- **Repository**: `https://github.com/masterMo66/snake-game`
- **GitHub Pages Settings**: `https://github.com/masterMo66/snake-game/settings/pages`
- **Actions Logs**: `https://github.com/masterMo66/snake-game/actions`
- **Live Site**: `https://masterMo66.github.io/snake-game` (after setup)

## 📞 Need Help?

If GitHub Pages still doesn't work:
1. Check repository visibility (must be public)
2. Ensure you have admin access to the repository
3. Contact GitHub Support if issues persist