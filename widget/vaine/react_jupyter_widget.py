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

import ipywidgets as widgets
from traitlets import Unicode, Dict

import re

import numpy as np
from umap import UMAP

from sklearn.preprocessing import StandardScaler
from sklearn.cluster import AgglomerativeClustering
from sklearn.pipeline import Pipeline

from .util import reorder

@widgets.register
class ReactJupyterWidget(widgets.DOMWidget):
    """An example widget."""
    _view_name = Unicode('ReactView').tag(sync=True)
    _model_name = Unicode('ReactModel').tag(sync=True)
    _view_module = Unicode('vaine-widget').tag(sync=True)
    _model_module = Unicode('vaine-widget').tag(sync=True)
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    _model_module_version = Unicode('^0.1.0').tag(sync=True)

    component = Unicode().tag(sync=True)
    props = Dict().tag(sync=True)

    def __init__(self, **kwargs):
        super().__init__()

        self.component = self.__class__.__name__
        self.props = kwargs

def to_parent_pointers(children):
    n = len(children) + 1
    left, right = children.T

    parents = np.arange(2*n - 1)
    parents[left] = parents[right] = np.arange(n, 2*n - 1)
    return parents

def project_and_cluster(X, manifold):
    X_2d = manifold.fit_transform(X) if X.shape[1] > 2 else X
    
    hierarchy = AgglomerativeClustering(
        linkage='ward',
        affinity='euclidean'
        # connectivity=manifold.graph_
    ).fit(X_2d)

    return {
        'points': X_2d.round(3).tolist(),
        'parents': to_parent_pointers(hierarchy.children_).tolist()
    }

def handle_column_filter(data, ex):
    if type(ex) == str:
        mask = ~data.columns.map(re.compile(ex).match).isnull()
        return list(data.columns[mask])
    
    return ex

@widgets.register
class VaineWidget(ReactJupyterWidget):
    def __init__(self, data, treatments='Treatment.*', outcomes='Outcome.*', ignore=[], **kwargs):
        
        self.data = data

        self.treatments = handle_column_filter(data, treatments)
        self.outcomes = handle_column_filter(data, outcomes)
        self.ignore = handle_column_filter(data, ignore)
                
        self.covariates = reorder(
            self.data.drop(columns=set(self.outcomes).union(self.ignore)),
        )
        
        pipe = Pipeline([
            ('norm', StandardScaler()),
            ('umap', UMAP(random_state=123456789))
        ])
        
        # todo: allow user to pass in their own latent representation
        self.latent_representation = {
            t: project_and_cluster(
                self.covariates.drop(columns=[t]),
                pipe
            )
            for t in self.treatments
        }
        
        super().__init__(
            treatments=self.treatments,
            outcomes=self.outcomes,
            covariates=list(self.covariates),
            ignore=self.ignore,
            data=self.data.to_dict(orient='split'),
            latentRepresentation=self.latent_representation,
            **kwargs
        )

