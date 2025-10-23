PAML Workflow — a reproducible bioinformatics pipeline for estimating evolutionary rates across yeast proteomes.  
I used PAML (Phylogenetic Analysis by Maximum Likelihood) together with Tranalign to link nucleotide and protein alignments for accurate dN/dS calculations.  
The workflow automated ancestral state inference and branch-specific rate modeling across eight Saccharomyces species.  
I built helper scripts in Python to parse control files, organize outputs, and merge results into a unified dataset.  
Jobs were executed on the BlueHive HPC cluster with batch submission for thousands of gene alignments.  
The analysis connected synonymous and nonsynonymous substitution rates to thermostability and growth-temperature adaptation.  
Results showed rate heterogeneity among orthologs and highlighted correlations between dN/dS and protein stability.  
The pipeline is modular and can be adapted for other comparative genomics studies.
