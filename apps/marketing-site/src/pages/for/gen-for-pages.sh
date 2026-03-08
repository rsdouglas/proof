#!/bin/bash
# Generate /for/ pages from template

generate_page() {
  local file=$1
  local title=$2
  local desc=$3
  local h1=$4
  local intro=$5
  local h2a=$6
  local body_a=$7
  local h2b=$8
  local bullets=$9
  local h2c=${10}
  local body_c=${11}
  local cta=${12}

  cat > "$file" << EOF
---
import Base from '../../layouts/Base.astro';
---
<Base title="$title | SocialProof" description="$desc">
  <main>
    <section style="max-width:860px;margin:0 auto;padding:3rem 1.5rem;">
      <h1 style="font-size:2.5rem;font-weight:800;line-height:1.2;margin-bottom:1rem;">
        $h1
      </h1>
      <p style="font-size:1.2rem;color:#555;margin-bottom:2rem;">$intro</p>

      <h2 style="font-size:1.6rem;font-weight:700;margin-top:2.5rem;">$h2a</h2>
      <p>$body_a</p>

      <h2 style="font-size:1.6rem;font-weight:700;margin-top:2.5rem;">$h2b</h2>
      <ul style="padding-left:1.5rem;line-height:1.9;">
        $bullets
      </ul>

      <h2 style="font-size:1.6rem;font-weight:700;margin-top:2.5rem;">$h2c</h2>
      <p>$body_c</p>

      <div style="background:#f0f7ff;border-radius:12px;padding:2rem;margin-top:3rem;text-align:center;">
        <h2 style="font-size:1.8rem;font-weight:800;margin-bottom:0.5rem;">$cta</h2>
        <p style="color:#555;margin-bottom:1.5rem;">Free forever for 1 active widget. No credit card required.</p>
        <a href="https://app.socialproof.dev/signup" style="background:#2563eb;color:white;padding:0.9rem 2rem;border-radius:8px;text-decoration:none;font-weight:700;font-size:1.1rem;">Get Started Free</a>
      </div>
    </section>
  </main>
</Base>
EOF
  echo "Created $file"
}

