<!-- Another tab: developer docs, so the widget is shown over a busy, technical page -->
<div class="docs">
	<aside class="side" aria-label="Docs navigation">
		<span class="brand">Tidepool <span>Docs</span></span>
		<p class="group">Getting started</p>
		<span>Install</span>
		<span>Authentication</span>
		<p class="group">Guides</p>
		<span class="current">Webhooks</span>
		<span>Retries</span>
		<span>Rate limits</span>
		<span>Pagination</span>
	</aside>
	<article class="content">
		<h3>Webhooks</h3>
		<p>
			Tidepool sends a <code>POST</code> request to your endpoint whenever an event happens in your
			workspace. Respond with any <code>2xx</code> status within ten seconds to confirm delivery.
		</p>
		<h4>Verify the signature</h4>
		<p>Every request carries a signature header. Check it before trusting the body.</p>
		<pre><code><span class="k">const</span> signature = req.headers[<span class="s">'tidepool-signature'</span>];
<span class="k">const</span> expected = hmac(secret, req.rawBody);

<span class="k">if</span> (!timingSafeEqual(signature, expected)) {'{'}
  <span class="k">return</span> res.status(<span class="n">401</span>).end();
{'}'}</code></pre>
		<h4>Retries</h4>
		<p>
			Failed deliveries are retried up to eight times over roughly a day, with the gap between attempts
			doubling each time. Make your handler safe to run twice for the same event.
		</p>
	</article>
</div>

<style>
	.docs {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: 200px 1fr;
		background: var(--web-bg);
		color: var(--web-text);
		font-family: var(--font);
		text-align: left;
		overflow: hidden;
	}

	.side {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 20px 16px;
		background: var(--web-soft);
		border-right: 1px solid var(--web-line);
		font-size: 13.5px;
		color: var(--web-muted);
	}

	.side > span {
		padding: 5px 10px;
		border-radius: 6px;
	}

	.side .current {
		background: var(--web-select);
		color: var(--web-select-text);
		font-weight: 500;
	}

	.brand {
		font-weight: 500;
		font-size: 15px;
		color: var(--web-text);
		padding: 0 10px 14px !important;
	}

	.brand span {
		font-weight: 500;
		color: var(--web-muted);
	}

	.group {
		margin: 14px 10px 4px;
		font-size: 12px;
		font-weight: 500;
		color: var(--web-muted);
	}

	.content {
		overflow: auto;
		padding: 28px 36px 220px;
		max-width: 680px;
		font-size: 15px;
		line-height: 1.65;
	}

	h3 {
		margin: 0 0 12px;
		font-size: 28px;
		letter-spacing: -0.015em;
		font-weight: 500;
	}

	h4 {
		margin: 26px 0 6px;
		font-size: 17px;
		font-weight: 500;
	}

	p {
		margin: 0 0 12px;
		color: var(--web-text-2);
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.88em;
	}

	p code {
		padding: 1px 5px;
		border-radius: 4px;
		background: var(--web-code-inline);
	}

	pre {
		margin: 12px 0;
		padding: 14px 16px;
		border-radius: 10px;
		background: #0f1419;
		color: #d7dde4;
		font-size: 13.5px;
		line-height: 1.6;
		overflow-x: auto;
	}

	.k {
		color: #ff8f66;
	}
	.s {
		color: #9ad27a;
	}
	.n {
		color: #79b8ff;
	}

	@container viewport (max-width: 640px) {
		.docs {
			grid-template-columns: 1fr;
		}
		.side {
			display: none;
		}
		.content {
			padding: 20px 16px 260px;
		}
	}
</style>
