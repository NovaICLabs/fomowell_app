# Fomowell

## Background

In recent years, the meme ecosystem has evolved from being a niche entertainment segment to a unique value creation arena in the blockchain world. Platforms like Pump.fun, through mechanisms such as fair launches and bonding curve pricing, have brought unprecedented attention to the high-risk, high-reward meme token space. These successful projects not only deliver early gains to investors and communities but also accelerate consensus-building and cultural symbol dissemination, injecting fresh vitality into blockchain narratives.

As the meme ecosystem flourishes, the trend of integrating AI with memes has garnered significant attention. AI agent-themed memes are bridging technology and creativity, opening new dimensions for blockchain storytelling. However, whether it’s traditional meme tokens or AI-powered innovations, the same challenges persist: balancing cost, performance, scalability, and data management to enable communities and creators to launch, manage, and expand their tokens and content more effectively.

This is where the Internet Computer (IC) steps in. As a next-generation high-performance decentralized network, IC addresses these challenges with near-zero gas fees, support for high-frequency transactions, and seamless execution of complex computations. IC further enables on-chain data storage and application deployment. On this foundation, meme tokens—along with associated content such as AI models and data—can be managed and processed either fully on-chain or tightly coupled with on-chain environments. While fully on-chain AI training and inference remain technically and resource-intensive, IC’s extensible architecture and flexibility lay a strong foundation for future on-chain/off-chain AI data processing and module verification.

With its robust performance and scalability, IC not only supports the growth of the meme culture but also opens up new possibilities for combining meme tokens with AI-powered applications. By lowering operational costs and optimizing data management, IC empowers creators and investors to develop a richer meme ecosystem in the future, including potential AI-assisted decision-making, automated trading strategies, and intelligent governance.

## Introduction

#### What is Fomowell?

Fomowell is a decentralized meme coin launchpad built on the **Internet Computer (IC)**. Drawing inspiration from the success of platforms like Pump.fun, Fomowell offers an efficient, flexible, and transparent ecosystem for creators, investors, and communities. It further combines IC’s robust infrastructure with potential AI-driven applications for a truly innovative experience.

In the Fomowell ecosystem, memes are no longer just entertaining symbols. They become multi-dimensional vehicles for community consensus, value creation, and technological innovation. With IC’s scalability and on-chain storage capabilities, communities can explore future scenarios like on-chain AI model storage, parameter verification, or integration with off-chain AI services, laying the groundwork for long-term innovation and growth in the meme ecosystem.

#### What Can Fomowell Do?

1. **Support Meme Coin Issuance and Management**  
   Using IC’s customizable front-end framework, communities can easily build their unique meme coin launch interfaces. With secure on-chain storage and high-performance support, communities can efficiently manage liquidity and foster ecosystem growth, setting the stage for AI-assisted features like automated strategies or data analysis.

2. **Deep Collaboration with IC Ecosystem Projects**  
   Fomowell actively collaborates with leading IC ecosystem projects, such as:  
   - **DOGMI (dogmi.fun):** Providing customized front-end solutions and liquidity management.  
   - **SNEEDDAO (launch.sneeddao.com):** Assisting in building community-driven meme coin launch platforms.  

   These collaborations strengthen Fomowell’s position as a vital hub within the IC ecosystem while paving the way for integrating additional third-party AI services.

3. **Liquidity Lock-in for Community DAOs**  
   Fomowell’s tokenomics model locks 50% of token liquidity into community DAOs, providing robust financial support for DAO governance and laying the foundation for future AI-augmented governance (e.g., AI tools offering analysis insights).

4. **Enhanced Governance and Incentive Mechanisms**  
   Leveraging IC’s **SNS framework**, Fomowell ensures true decentralized governance. Users can participate in decision-making through voting and earn rewards by contributing content, engaging in activities, or supporting ecosystem growth. In the future, AI services integrated with on-chain data may provide members with actionable insights, enabling smarter decision-making.

5. **Cross-Chain Compatibility and Global Participation**  
   With IC’s cross-chain capabilities, Fomowell supports seamless integration of meme coins with other major blockchains, enabling global accessibility. In the future, compliant and technically feasible scenarios may explore incorporating external AI data sources or analytical results into the ecosystem to support cross-chain strategies and information integration.


## Deploy

### [fomowell-launcher](fomowell-launcher)

#### build project

```shell
 cd fomowell-laucher
 sh start.sh
```

#### deploy 

```shell
#dev env load local env
sh deploy.sh local 

#test env load test env
sh deploy.sh test
```

### interface describe

#### Get User Profile

```rust
async fn get_user(user_pid:Principal) -> UserProfile
```

#### Edit User Profile

```rust
async fn edit_user(user_name:Option<String>,avatar:Option<String>) -> Result<(),String>`
```