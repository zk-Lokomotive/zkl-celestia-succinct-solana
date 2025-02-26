# Svelte + Vite

This template should help get you started developing with Svelte in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Need an official Svelte framework?

Check out [SvelteKit](https://github.com/sveltejs/kit#readme), which is also powered by Vite. Deploy anywhere with its serverless-first approach and adapt to various platforms, with out of the box support for TypeScript, SCSS, and Less, and easily-added support for mdsvex, GraphQL, PostCSS, Tailwind CSS, and more.

## Technical considerations

**Why use this over SvelteKit?**

- It brings its own routing solution which might not be preferable for some users.
- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

This template contains as little as possible to get started with Vite + Svelte, while taking into account the developer experience with regards to HMR and intellisense. It demonstrates capabilities on par with the other `create-vite` templates and is a good starting point for beginners dipping their toes into a Vite + Svelte project.

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

**Why `global.d.ts` instead of `compilerOptions.types` inside `jsconfig.json` or `tsconfig.json`?**

Setting `compilerOptions.types` shuts out all other types not explicitly listed in the configuration. Using triple-slash references keeps the default TypeScript setting of accepting type information from the entire workspace, while also adding `svelte` and `vite/client` type information.

**Why include `.vscode/extensions.json`?**

Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

**Why enable `checkJs` in the JS template?**

It is likely that most cases of changing variable types in runtime are likely to be accidental, rather than deliberate. This provides advanced typechecking out of the box. Should you like to take advantage of the dynamically-typed nature of JavaScript, it is trivial to change the configuration.

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/sveltejs/svelte-hmr/tree/master/packages/svelte-hmr#preservation-of-local-state).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

```js
// store.js
// An extremely simple external store
import { writable } from 'svelte/store'
export default writable(0)
```

# ZKL (Zero Knowledge Lambda) - Solana & Celestia & ZK File Transfer

ZKL, dosyaları güvenli bir şekilde paylaşmak için IPFS, Solana, Celestia Data Availability (DA) katmanı ve Zero Knowledge Proof (ZKP) teknolojilerini birleştiren güçlü bir merkezi olmayan dosya transfer uygulamasıdır.

## Özellikler

- **IPFS Entegrasyonu**: Dosyaları merkezi olmayan depolama üzerinde barındırma
- **Solana Blockchain**: İşlemleri, dosya referanslarını ve doğrulamaları kaydetme
- **Celestia DA Katmanı**: Veri erişilebilirliğini ve kalıcılığını sağlama
- **Zero Knowledge Proofs**: Dosya içeriğini ifşa etmeden doğrulama

## Teknoloji Yığını

- **Frontend**: Svelte, Vite
- **Blockchain**: Solana (DevNet)
- **DA Katmanı**: Celestia
- **Depolama**: IPFS (InterPlanetary File System)
- **ZK Proofs**: snarkjs

## Kurulum

### Gereksinimler

- Node.js (v16+)
- IPFS Daemon
- Solana CLI (DevNet için)
- Celestia Light Client (Opsiyonel)

### Adımlar

1. Repoyu klonlayın:
   ```
   git clone https://github.com/kullaniciadi/zkl-mvp-solana-devnet.git
   cd zkl-mvp-solana-devnet
   ```

2. Bağımlılıkları yükleyin:
   ```
   npm install
   ```

3. IPFS daemon'ı başlatın:
   ```
   ipfs daemon
   ```

4. Celestia Light Client'ı başlatın (Opsiyonel):
   ```
   celestia light start
   ```

5. Uygulamayı başlatın:
   ```
   npm run dev
   ```

## Nasıl Çalışır?

1. **Dosya Yükleme**: Kullanıcı bir dosya yükler, dosya IPFS'e yüklenir ve bir CID (Content Identifier) döndürülür.
2. **Celestia DA**: IPFS CID'si, kalıcılık ve güvenilir erişilebilirlik için Celestia DA katmanına kaydedilir.
3. **Zero Knowledge Proof**: Dosyanın bütünlüğünü ve varlığını gizlilik koruyarak doğrulayan bir ZK Proof oluşturulur.
4. **Solana Transferi**: Dosyanın referansı ve ilgili metadata, alıcıya Solana blockchain üzerinden transfer edilir.
5. **Doğrulama**: Alıcı, ZK Proof'u kullanarak dosyanın bütünlüğünü doğrulayabilir ve Celestia veya IPFS üzerinden dosyaya erişebilir.

## Güvenlik Özellikleri

- **Merkezi Olmayan Depolama**: IPFS ile güvenli ve merkezi olmayan dosya depolama.
- **Blokzincir Doğrulama**: Solana üzerinde dosya transferlerinin doğrulanabilir kaydı.
- **Veri Kalıcılığı**: Celestia DA katmanı sayesinde garantili veri erişilebilirliği.
- **Gizlilik Koruyan Doğrulama**: Zero Knowledge Proofs ile dosya içeriğini açıklamadan bütünlük doğrulaması.

## Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen bir Pull Request göndermeden önce bir Issue açın ve değişikliklerinizi tartışın.

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır - daha fazla bilgi için [LICENSE](LICENSE) dosyasına bakın.
