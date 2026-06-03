
// ============================================
// SONIQ NOW — Welcome Email + Clerk Webhook
// ============================================
// Paste this into your Replit project as:
// server/webhooks/clerk.js (or wherever your routes live)

const { Resend } = require('resend');
const crypto = require('crypto');

const resend = new Resend(process.env.RESEND_API_KEY);
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

// ─── EMAIL TEMPLATE ───────────────────────────────────────────
function buildWelcomeEmail(firstName, email) {
  const name = firstName || 'Artist';
  
  return {
    from: 'Soniq Now <hello@soniqnow.com>',
    to: email,
    subject: `Welcome to Soniq Now, ${name} 🎵`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; background: #0a0a0f; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background: #0a0a0f; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 48px 40px; text-align: center; }
    .logo { font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: -1px; }
    .logo span { color: #a855f7; }
    .tagline { color: #94a3b8; font-size: 14px; margin-top: 8px; }
    .hero { padding: 48px 40px 32px; text-align: center; }
    .hero h1 { color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 16px; line-height: 1.3; }
    .hero p { color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0; }
    .mission-bar { background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); padding: 20px 40px; text-align: center; }
    .mission-bar p { color: #ffffff; font-size: 14px; font-weight: 600; margin: 0; }
    .features { padding: 40px; }
    .features h2 { color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 24px; }
    .feature { display: flex; align-items: flex-start; margin-bottom: 24px; }
    .feature-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; margin-right: 16px; }
    .feature-icon.purple { background: rgba(168, 85, 247, 0.15); }
    .feature-icon.blue { background: rgba(59, 130, 246, 0.15); }
    .feature-icon.green { background: rgba(16, 185, 129, 0.15); }
    .feature-text h3 { color: #ffffff; font-size: 16px; font-weight: 700; margin: 0 0 4px; }
    .feature-text p { color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.5; }
    .cta-section { padding: 16px 40px 48px; text-align: center; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 40px; border-radius: 50px; letter-spacing: 0.5px; }
    .footer { background: #050508; padding: 32px 40px; text-align: center; }
    .footer p { color: #475569; font-size: 12px; margin: 0 0 8px; }
    .divider { height: 1px; background: rgba(255,255,255,0.06); margin: 0 40px; }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- HEADER -->
    <div class="header">
      <div class="logo">Soniq<span>Now</span></div>
      <div class="tagline">Africa's Music Infrastructure</div>
    </div>

    <!-- HERO -->
    <div class="hero">
      <h1>Welcome, ${name}. Your sound just got infrastructure. 🎵</h1>
      <p>You're now part of a movement built for African independent artists. Everything you need to create, distribute, and monetize your music — in one place.</p>
    </div>

    <!-- MISSION BAR -->
    <div class="mission-bar">
      <p>🌍 You're among our first 100 African artists — the founders of something big.</p>
    </div>

    <!-- FEATURES -->
    <div class="features">
      <h2>Here's what you can do right now:</h2>
      
      <div class="feature">
        <div class="feature-icon purple">🌐</div>
        <div class="feature-text">
          <h3>Soniq Distribute</h3>
          <p>Send your music to Spotify, Apple Music, Tidal, Boomplay, Audiomack and 150+ stores in 200+ countries. Keep 100% of your royalties.</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-icon blue">🎚️</div>
        <div class="feature-text">
          <h3>Soniq Studio</h3>
          <p>Mix and master your tracks with our 12-channel console and Dolby Atmos 3D spatial mixer — professional quality, zero cost.</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-icon green">🛒</div>
        <div class="feature-text">
          <h3>Soniq Market</h3>
          <p>Connect with producers, hire session musicians, find mixing engineers — or sell your own beats and services.</p>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- CTA -->
    <div class="cta-section">
      <p style="color: #94a3b8; font-size: 15px; margin-bottom: 24px;">Ready to put your music in front of the world?</p>
      <a href="https://soniqnow.com/distribute" class="cta-btn">Submit Your First Release →</a>
    </div>

    <div class="divider"></div>

    <!-- FOOTER -->
    <div class="footer">
      <p>Soniq Now — Built for African artists, by someone who understands the grind.</p>
      <p style="margin-top: 4px;">Questions? Reply to this email — hello@soniqnow.com</p>
      <p style="margin-top: 16px; color: #334155;">© 2026 Soniq Now. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
    `
  };
}

// ─── VERIFY CLERK WEBHOOK SIGNATURE ───────────────────────────
function verifyClerkSignature(payload, headers) {
  const svixId = headers['svix-id'];
  const svixTimestamp = headers['svix-timestamp'];
  const svixSignature = headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) return false;

  const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
  const secret = CLERK_WEBHOOK_SECRET.startsWith('whsec_')
    ? Buffer.from(CLERK_WEBHOOK_SECRET.slice(6), 'base64')
    : Buffer.from(CLERK_WEBHOOK_SECRET, 'base64');

  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('base64');

  const signatures = svixSignature.split(' ').map(s => s.slice(3));
  return signatures.some(sig => sig === computedSignature);
}

// ─── CLERK WEBHOOK ENDPOINT ────────────────────────────────────
// Add this route to your Express app:
// app.post('/api/webhooks/clerk', clerkWebhookHandler);

async function clerkWebhookHandler(req, res) {
  try {
    const rawBody = JSON.stringify(req.body);
    
    // Verify signature
    const isValid = verifyClerkSignature(rawBody, req.headers);
    if (!isValid) {
      console.error('Invalid Clerk webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { type, data } = req.body;

    if (type === 'user.created') {
      const firstName = data.first_name || '';
      const email = data.email_addresses?.[0]?.email_address;

      if (!email) {
        return res.status(400).json({ error: 'No email found' });
      }

      const emailData = buildWelcomeEmail(firstName, email);
      const result = await resend.emails.send(emailData);

      console.log(`Welcome email sent to ${email}:`, result.id);
      return res.status(200).json({ success: true, emailId: result.id });
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ─── TEST FUNCTION ─────────────────────────────────────────────
// Run this in Replit Shell to test end-to-end:
// node -e "require('./webhooks/clerk').testWelcomeEmail()"

async function testWelcomeEmail() {
  const emailData = buildWelcomeEmail('Prexy', 'hello@soniqnow.com');
  const result = await resend.emails.send(emailData);
  console.log('Test email sent! ID:', result.id);
}

module.exports = { clerkWebhookHandler, buildWelcomeEmail, testWelcomeEmail };
