# VAINE Widget

# Copyright (c) 2020, Pacific Northwest National Laboratories
# All rights reserved.

# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:

# * Redistributions of source code must retain the above copyright notice, this
#   list of conditions and the following disclaimer.

# * Redistributions in binary form must reproduce the above copyright notice,
#   this list of conditions and the following disclaimer in the documentation
#   and/or other materials provided with the distribution.

# * Neither the name of the copyright holder nor the names of its
#   contributors may be used to endorse or promote products derived from
#   this software without specific prior written permission.

# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
# FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
# OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

from itertools import product, combinations, permutations

import matplotlib.pyplot as plt

import numpy as np
import pandas as pd

from scipy.spatial.distance import squareform
from scipy.stats import pearsonr
import networkx as nx

def grid_from_product(rows, cols, s=4, ar=1, row_format=None, col_format=None, **kwargs):
    n_rows = len(rows)
    n_cols = len(cols)

    fd = {
        'fontweight': 'bold'
    }
    
    plt.figure(figsize=(ar*s*n_cols, s*n_rows))
    
    for d, (r, c) in enumerate(product(rows, cols)):        
        ax = plt.subplot(n_rows, n_cols, d + 1, **kwargs)
        
        i = d//n_cols
        j = d%n_cols
        
        if i == 0:
            plt.title(
                c if col_format is None else col_format(c),
                fontdict=fd
            )
        if j == 0:
            plt.ylabel(
                r if row_format is None else row_format(r),
                fontdict=fd
            )

        yield r, c, ax

def sig(p, bins=np.array([.001, .01, .05])):
    return ''.join(['*']*(p <= bins).sum())

def reorder(data, absolute=False, return_corr=False, approx=False, threshold=0, split=True):

    if data.shape[1] > 6:
        approx = True

    modified_corr = corr = pd.DataFrame(
        squareform([
            pearsonr(data[r], data[c])[0]
            for r, c in combinations(data, 2)
        ]),
        index=list(data),
        columns=list(data)
    ).fillna(0)

    if absolute:
        modified_corr = modified_corr.abs()
    modified_corr = modified_corr*(modified_corr >= threshold)

    if approx:
        G = nx.from_pandas_adjacency(modified_corr)
        data = data[nx.spectral_ordering(G)]
    else:
        values = modified_corr.values

        split = int(split == True)
        
        def objective(ii):
            jj = np.roll(ii, 1)
            return values[ii[split:], jj[split:]].sum()
        
        best = max(
            map(np.array, permutations(range(len(values)))),
            key=objective
        )
        data = data[data.columns[best]]
        
    if return_corr:
        order = list(data)
        return data, corr.loc[order, order]
    
    return data
