export function renderLoginPage(error?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ciar - Login</title>
  <link rel="stylesheet" href="/css/legacy.css">
</head>
<body>
  <div class="login-box">
    <h2 style="margin-top:0; color:#1a365d;">Ciar - Photo Access</h2>
    <p style="color:#666; font-size:12px; margin-bottom:15px;">Enter the shared access password to view and download photos.</p>

    ${error ? `<div class="alert alert-error">${escapeHtml(error)}</div>` : ''}

    <form method="POST" action="/login">
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" class="form-control" autofocus required>
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%; padding:10px;">Sign In</button>
    </form>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}
