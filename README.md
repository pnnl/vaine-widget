# VAINE Widget

## Installation

`git clone` the repo locally

### Python packages

Install [Anaconda](https://docs.anaconda.com/anaconda/install/)

Install UMAP:
```bash
conda install umap-learn -c conda-forge
```

Verify that the environment defaults to python 3

### Javascript packages

```bash
npm install
```

### Setup

```bash
sh setup-develop.sh
sh update-develop.sh
```

## Usage

### Demo Notebook

*Note: We recommend using Jupyter in full screen mode when running VAINE. Widget may appear truncated otherwise.*

Open Jupyter Notebook:
```bash
jupyter notebook
```

Navigate to `notebooks/VAINE demo`

This file should run without errors

### Custom Usage

Load dataset from local filepath or url:
```python
import pandas as pd
df = pd.read_json(url)
df = pd.read_csv(url)
```

If necessary, create an index column. Note that indices need to be unique:
```python
df = df.set_index('variable')
```

Define treatment, outcome and ignore variables. VAINE currently only handles numerical variables, categorical variables should be ignored.
```python
treatments = df.columns[df.columns.str.startswith('Treatment')].tolist()
outcomes = df.columns[df.columns.str.startswith('Outcome')].tolist()

ignore = ['variable 1', 'variable 2']
```

Run VAINE:
```python
vaineWidget(df, treatments, outcomes, ignore)
```