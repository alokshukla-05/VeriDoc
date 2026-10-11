export interface SampleDoc {
  id: string;
  title: string;
  category: string;
  level: 'undergraduate' | 'postgraduate' | 'journal_publication' | 'high_school';
  description: string;
  text: string;
}

export const SAMPLE_DOCUMENTS: SampleDoc[] = [
  {
    id: 'sample-ai-ethics',
    title: 'Algorithmic Accountability and Bias Mitigation in Clinical Diagnostic AI',
    category: 'Biomedical Ethics / AI',
    level: 'postgraduate',
    description: 'Master’s essay examining ethical concerns in neural network diagnostics. Contains a mix of paraphrased literature and missing attributions.',
    text: `Algorithmic Accountability and Bias Mitigation in Clinical Diagnostic AI
Submitted by: Graduate Department of Health Informatics

Abstract
Machine learning algorithms have demonstrated diagnostic accuracy comparable to board-certified clinicians in radiology and dermatology. However, algorithmic bias poses severe systemic risks to patient equity. This paper investigates disparities in training datasets, institutional accountability mechanisms, and proposed mathematical fairness constraints.

1. Introduction
The transition toward predictive healthcare informatics has accelerated dramatically over the past five years. Autonomous clinical systems now analyze mammograms, diabetic retinopathy fundus images, and cardiac arrhythmias with sensitivity exceeding 94%. Despite these clinical breakthroughs, historical disparities embedded within training datasets frequently manifest as biased diagnostic outputs. When demographic representation is skewed toward affluent cohorts, machine learning models exhibit degraded sensitivity on marginalized patient populations.

2. Epistemic Bias in Healthcare Machine Learning
Modern deep learning classifiers are predominantly trained on retrospective electronic health records gathered from tertiary academic medical centers. As noted by Obermeyer and Mullainathan, commercial risk-prediction algorithms applied to roughly 200,000 commercial health plan members systematically prioritized white patients over sicker Black patients for specialized care management programs. The fundamental flaw was the selection of annual healthcare spending as a proxy variable for clinical illness, failing to account for racial disparities in access to care.

Furthermore, computer vision models trained on public dermatological archives show a pronounced shortage of Fitzpatrick skin phototypes V and VI. When tested on dark skin tones, diagnostic sensitivity for malignant melanoma drops precipitously from 89% to 61%. This represents an egregious disparity that risks fatal diagnostic delays if deployed without rigorous external validation.

3. Fairness Metrics and Algorithmic Parity
To rectify these systemic disparities, computer scientists have formulated competing mathematical definitions of algorithmic fairness. Demographic parity requires that the probability of a positive classification is statistically invariant across protected demographic attributes:
P(Y_hat = 1 | A = 0) = P(Y_hat = 1 | A = 1)

However, equalized odds mandates that both true positive rates and false positive rates remain equal across demographic groups:
P(Y_hat = 1 | A = 0, Y = y) = P(Y_hat = 1 | A = 1, Y = y)

As proved by Kleinberg et al. (2016), except under degenerate conditions where base rates are identical or prediction accuracy is absolute, demographic parity and predictive parity are mathematically incompatible. Clinicians and policy makers must therefore make value judgments regarding which fairness trade-off minimizes patient harm.

4. Proposed Governance Framework
We advocate a multi-tiered regulatory framework comprising:
1. Mandated algorithmic impact assessments (AIA) prior to clinical trial enrollment.
2. Federated learning protocols across safety-net hospitals to diversify training cohorts without centralized data transfer.
3. Post-market surveillance registries tracking algorithmic drift across demographic sub-strata.

References
1. Obermeyer, Z., Powers, B., Vogeli, C., & Mullainathan, S. (2019). Dissecting racial bias in an algorithm used to manage the health of populations. Science, 366(6464), 447-453.
2. Kleinberg, J., Mullainathan, S., & Raghavan, M. (2016). Inherent trade-offs in the fair determination of risk scores. arXiv preprint arXiv:1609.05807.
3. Rajkomar, A., Hardt, M., Howell, M. D., Corrado, G., & Chin, M. H. (2018). Ensuring fairness in machine learning to advance health equity. Annals of Internal Medicine, 169(12), 866-872.`,
  },
  {
    id: 'sample-quantum-crypto',
    title: 'Post-Quantum Cryptographic Standards and Lattice-Based Key Exchange',
    category: 'Computer Science & Cybersecurity',
    level: 'journal_publication',
    description: 'Technical literature review of lattice cryptography and Shor’s algorithm vulnerabilities with detailed citations.',
    text: `Post-Quantum Cryptographic Standards and Lattice-Based Key Exchange: A Comparative Review

Abstract
The eventual realization of fault-tolerant quantum computation poses an existential challenge to contemporary asymmetric cryptography. Shor's polynomial-time integer factorization and discrete logarithm algorithm will completely compromise RSA, Diffie-Hellman, and Elliptic Curve Cryptography. In response, the National Institute of Standards and Technology (NIST) initiated an international standardization process for post-quantum public-key algorithms. This survey evaluates lattice-based cryptographic candidates, focusing on CRYSTALS-Kyber and Dilithium.

1. Quantum Threat Vectors and Asymmetric Vulnerabilities
Public-key infrastructures fundamentally rely on the computational hardness of mathematical number-theoretic problems. Shor's algorithm (1994) solves integer factorization and discrete logarithms in polynomial time O((log N)^3) on a sufficiently large quantum computer using quantum Fourier transforms. Consequently, an adversary capable of executing approximately 4,000 error-corrected logical qubits could breach 2048-bit RSA keys in a matter of hours.

Moreover, the phenomenon of "Store Now, Decrypt Later" (SNDL) attacks renders current encrypted communications vulnerable to retrospective decryption once quantum hardware matures. High-assurance governmental and military systems must therefore implement post-quantum cryptographic primitives immediately.

2. The Hardness of Lattice Problems
Lattice-based cryptography is predominantly founded on the shortest vector problem (SVP) and the closest vector problem (CVP) in high-dimensional Euclidean lattices. The Learning With Errors (LWE) problem, introduced by Regev in 2005, was proven to be at least as hard as worst-case standard lattice problems under quantum reductions.

To improve computational throughput and minimize ciphertext footprint, Ring-LWE and Module-LWE introduce algebraic ring structures. CRYSTALS-Kyber operates over the module-learning-with-errors problem (M-LWE) over polynomial rings R_q = Z_q[X]/(X^n + 1), where n = 256 and q = 3329. This design yields compact public keys (~1184 bytes for NIST Security Category 3) and sub-millisecond encapsulation times on standard ARM and x86 processors.

3. Performance and Implementation Considerations
Comparative benchmarks on embedded microcontrollers demonstrate that CRYSTALS-Kyber exhibits exceptional key exchange efficiency compared to code-based alternatives like Classic McEliece, which suffer from massive megabyte-scale public key sizes. However, side-channel attack vulnerabilities (specifically power analysis and fault injection) remain active areas of hardening before widespread commercial adoption.

References
1. Shor, P. W. (1994). Algorithms for quantum computation: discrete logarithms and factoring. Proceedings 35th Annual Symposium on Foundations of Computer Science, 124-134.
2. Regev, O. (2005). On lattices, learning with errors, random linear codes, and cryptography. Proceedings of the 37th Annual ACM Symposium on Theory of Computing, 84-93.
3. Alkim, E., Ducas, L., Pöppelmann, T., & Schwabe, P. (2016). Post-quantum key exchange—a new hope. 25th USENIX Security Symposium, 327-343.`,
  },
  {
    id: 'sample-microplastics',
    title: 'Microplastic Bioaccumulation in Marine Benthic Organisms and Trophic Transfer',
    category: 'Environmental Science',
    level: 'undergraduate',
    description: 'Undergraduate biology term paper analyzing microplastic ingestion in coastal estuaries with standard academic structure.',
    text: `Microplastic Bioaccumulation in Marine Benthic Organisms and Trophic Transfer

Author: Student Academic Research Submission
Course: Marine Biology 302: Coastal Estuarine Ecology

1. Introduction
Anthropogenic plastic debris represents one of the most pervasive contaminants throughout oceanic ecosystems. It is estimated that more than 14 million metric tons of plastic enter marine environments annually, degrading via ultraviolet photodegradation and mechanical wave abrasion into microplastic fragments measuring less than 5 millimeters in diameter. Benthic filter-feeding organisms, such as Mytilus edulis (blue mussels) and Crassostrea virginica (eastern oysters), ingest these microplastics indiscriminately due to overlap in particle dimensions with phytoplankton.

2. Ingestion Mechanisms and Tissue Translocation
Once ingested, microfibers and synthetic microbeads enter the digestive tract where chemical additives (including phthalates, bisphenol A, and polybrominated diphenyl ethers) can desorb into digestive fluids. Furthermore, nanoplastic particles smaller than 100 nanometers are capable of translocating across intestinal epithelial barriers through endocytosis, accumulating in circulatory hemolymph and hepatic tissues.

Laboratory exposure assays conducted by Browne et al. demonstrated that microplastic translocation in blue mussels resulted in significant histological inflammatory responses and granuloma formation after 48 hours of continuous exposure. This cellular toxicity reduces reproductive fecundity and impairs energetic reserves required for seasonal spawning.

3. Trophic Transfer in Higher Predators
When primary consumers accumulate microplastic burdens, higher trophic tier organisms (such as benthic flatfish, crustacean scavengers, and seabirds) consume concentrated particle loads. Biomagnification dynamics remain an active debate within marine toxicology; while chemical plasticizers biomagnify along food webs, physical polymer particles are frequently egested through intestinal peristalsis, resulting in variable retention kinetics across taxa.

4. Conclusion and Remediation
To safeguard estuarine biodiversity, regional wastewater treatment infrastructures must adopt advanced tertiary membrane bioreactors capable of filtering microfibers shed from synthetic textiles during domestic laundering.

Works Cited
Browne, M. A., Dissanayake, A., Galloway, T. S., Lowe, D. M., & Thompson, R. C. (2008). Ingested microscopic plastic translocates to the circulatory system of the mussel, Mytilus edulis. Environmental Science & Technology, 42(13), 5026-5031.
Galloway, T. S., Cole, M., & Lewis, C. (2017). Plastics in the marine environment. Nature Ecology & Evolution, 1(5), 0116.
Cole, M., Lindeque, P., Halsband, C., & Galloway, T. S. (2011). Microplastics as contaminants in the marine environment: a review. Marine Pollution Bulletin, 62(12), 2588-2597.`,
  },
];
