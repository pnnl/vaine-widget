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

import re
import warnings

import seaborn as sns
import pandas as pd
import numpy as np
import networkx as nx

import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
from matplotlib.colors import to_rgba_array

import seaborn as sns

from sklearn.decomposition import NMF, FastICA
from sklearn.neighbors import kneighbors_graph
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import AffinityPropagation

from scipy.stats import pearsonr, linregress

from umap import UMAP

from .util import sig, grid_from_product

from gtvisutils import plots

default_correlation_colors = plt.cm.coolwarm([0.0, 1.0])

def decorrelate_covariates(df, n_components=10, search=False):
    treatments = df.columns[df.columns.str.startswith('Treatment')].tolist()

    data = df[treatments]
    training_data = df[treatments].drop_duplicates()
    
    if search:
        max_n_components = data.shape[1]

        models = pd.Series({
            i: NMF(n_components=i).fit(training_data)
            for i in range(1, max_n_components)
        })

        models.apply(lambda m: m.reconstruction_err_)\
            .plot.bar()
        plt.xlabel('# Components')
        plt.ylabel('Reconstruction error')
    
    m = NMF(n_components=n_components, random_state=1234567890)\
        .fit(training_data)
    sns.clustermap(pd.DataFrame(m.components_, columns=data.columns).T, cmap='Blues')

    sns.clustermap(m.transform(training_data), cmap='Greens')

    controlled_treatments = pd.DataFrame(
        m.transform(data),
        columns=[f'Treatment.{i + 1}' for i in range(m.n_components_)],
        index=data.index
    )

    return df.drop(columns=treatments)\
        .assign(**controlled_treatments)

def get_valid(df, min_value=0, max_value=0.05, show_any=True, include=[], exclude=[]):
    mask = (df >= min_value) & (df <= max_value)
    mask = mask.any(axis=1) if show_any else mask.all(axis=1)
    return set(df.index[mask])\
        .union(include).difference(exclude)

# class NaturalExperiment(ReactJupyterWidget):
class NaturalExperiment:
    def __init__(self, df, treatment, outcomes, pipe=StandardScaler(), clusters=None, latent_representation=None, ignore=[], treatments_as_covariates=True, verbose=False, regex='', **kwargs):

        self.df_original = df
        self.df = df.drop(columns=set(ignore).difference([treatment]))

        self.treatment = treatment
        self.outcomes = outcomes
        self.ignore = ignore

        self.regex = re.compile(regex)

        if not len(outcomes):
            warnings.warn('No outcomes were passed')
        
        if latent_representation is not None:
            self.X = latent_representation
        else:
            self.X = self.df.drop(columns=[treatment] + outcomes)

            if pipe is not None:
                self.X = pd.DataFrame(
                    pipe.fit_transform(self.X),
                    index=self.df.index
                )

        self.umap = UMAP(random_state=1234567890)
        
        self.xy = pd.DataFrame(
            self.umap.fit_transform(self.X),
            index=self.df.index,
            columns=['x', 'y']
        )

        if clusters is None:
            self.clusters = AffinityPropagation(**kwargs)\
                .fit_predict(self.xy.values)
        else:
            self.clusters = clusters

        self.clusters = pd.Series(self.clusters, index=df.index)

        self.stats, self.centroids = self.describe_clusters(self.clusters)

        A = kneighbors_graph(self.X, 1, mode='distance')\
            .astype(float)

        self.G = nx.from_scipy_sparse_matrix(A, create_using=nx.Graph)

    def describe_clusters(self, y=None):
        cols = [
            'slope',
            'intercept',
            'rvalue',
            'pvalue',
            'stderr',
        ]

        def linregress_cluster(dfk):
            df = pd.DataFrame([
                dict(
                    zip(
                        cols + ['Outcome'],
                        linregress(*dfk[[self.treatment, o]].values.T) + (o, )
                    )
                )
                for o in self.outcomes
                if (dfk[[self.treatment, o]].std() > 0).all()
            ])

            if len(df):
                return df.set_index('Outcome')

        stats = self.df.assign(cluster=self.clusters)\
            .groupby('cluster')\
            .apply(linregress_cluster)\
            .unstack()\
            .swaplevel(axis='columns')\
            .sort_index(axis='columns')

        g = self.xy.assign(cluster=self.clusters if y is None else y)\
            .groupby('cluster')

        centroids = g.mean()\
            .assign(n=g.size())

        return stats, centroids
        
    def plot_distance_hist(self):
        plt.hist([d['weight'] for _, _, d in self.G.edges(data=True)])
        
    def get_pairs(self, threshold=np.Inf):
        return [
            (u, v)
            for u, v, d in self.G.edges(data=True)
            if d['weight'] <= threshold
        ]
    
    def describe_pairs(self, pairs, outcome, dt=0, do=0):
        cols = [self.treatment, outcome]
        i, j = map(list, zip(*pairs))
        dfi = self.df.iloc[i][cols]
        dfj = self.df.iloc[j][cols]

        self.delta = delta = pd.DataFrame(
            dfj.values - dfi.values,
            columns=cols
        )

        widths = np.array([1, 1.5])
        interesting = (delta.abs() >= [dt, do]).all(axis=1)
        delta['interesting'] = interesting
        delta['linewidths'] = linewidths = widths[interesting.astype(int)]

        palette = np.array(['red', 'lightgray', 'black'])
        increasing = np.product(np.sign(delta[cols]), axis=1).astype(int)
        delta['colors'] = colors = palette[increasing + 1]

        delta['source'] = dfi.index
        delta['target'] = dfj.index

        return dfi, dfj, delta, ['colors', 'linewidths']

    def get_to_annotate(self, delta, outcome, annotate=1):
        delta = delta[delta.interesting]
        return delta\
            .assign(significance=delta[outcome].abs())\
            .sort_values('significance')\
            .tail(annotate)

    def plot_pairs(self, pairs, outcome, ax=None, threshold=1, annotate=1, **kwargs):
        cols = [self.treatment, outcome]

        dfi, dfj, delta, encodings = self.describe_pairs(pairs, outcome, **kwargs)
        arrows = [np.vstack(a) for a in zip(dfi.values, dfj.values)]

        lines = LineCollection(arrows, threshold=threshold, **delta[encodings])

        ax = ax or plt.gca()
        ax.add_collection(lines)
        ax.autoscale_view()
        
        ax.set_xlabel(self.treatment)
        ax.set_ylabel(outcome)

        to_annotate = self.get_to_annotate(delta, outcome, annotate)
        for c in ['source', 'target']:
            for s, xy in zip(to_annotate[c], self.df.loc[to_annotate[c], cols].values):
                ax.annotate(s, xy)
            
    def plot_arrows(self, pairs, outcome, ax=None, threshold=1, annotate=1, **kwargs):
        cols = [self.treatment, outcome]
        xy = self.xy

        dfi, dfj, delta, encodings = self.describe_pairs(pairs, outcome, **kwargs)

        u = .15*(xy.max() - xy.min()).max()
        n = pd.concat((dfi, dfj)).max().values
        
        print(n)

        def get_arrow(pi, pj, xyi):
            return np.vstack((xyi, xyi + (pj - pi)*u/n))

        arrows = [
            get_arrow(*z)
            for z in zip(dfi.values, dfj.values, xy.loc[dfi.index].values)
        ]

        lines = LineCollection(arrows, threshold=threshold, **delta[encodings])

        ax = ax or plt.gca()
        ax.add_collection(lines)
        ax.autoscale_view()

        to_annotate = self.get_to_annotate(delta, outcome, annotate)
        for (s, t), xy in zip(to_annotate[['source', 'target']].values, self.xy.loc[to_annotate.source].values):
                ax.annotate(f'{s} &\n{t}', xy)

    def summarize_coarsened_sets_embedding(self, outcome, r=1.5, colors=default_correlation_colors, ax=None, valid_cluster_size=20, invalid_cluster_size=.1, invalid_cluster_color='lightgray', **kwargs):

        df = pd.merge(self.stats[outcome], self.centroids, on='cluster')
        valid_clusters = self.get_valid_clusters(outcomes=[outcome], **kwargs)
        mask = df.index.map(valid_clusters.__contains__).astype(int)
        
        theta = np.pi/4*df.rvalue
        dx = r*np.cos(theta)
        dy = r*np.sin(theta)

        lines = np.array(list(zip(
            np.vstack([df.x.values - dx, df.y.values - dy]).T,
            np.vstack([df.x.values + dx, df.y.values + dy]).T
        )))
          
        widths = np.array([.5, 2])  
        line_collection = LineCollection(lines,
            linewidths=widths[mask],
            color='black'
        )
        
        ax = ax or plt.gca()

        sizes = self.clusters.apply(lambda c: valid_cluster_size if c in valid_clusters else invalid_cluster_size)
        colors = self.clusters.apply(lambda c: plt.cm.tab20(c) if c in valid_clusters else invalid_cluster_color)

        ax.scatter(
            *self.xy.values.T,
            s=sizes,
            c=colors
        )
        
        ax.add_collection(line_collection)
        
        plt.axis('equal')
        plt.xticks([])
        plt.yticks([])

    def summarize_coarsened_sets_lmplot(self, outcome, scatter=True, lw=3, ax=None, **kwargs):
        ax = ax or plt.gca()

        data = self.df[[self.treatment, outcome]]\
            .set_index(self.clusters)\
            .sort_index()

        valid_clusters = self.get_valid_clusters(
            outcomes=[outcome],
            **kwargs
        )

        for c in valid_clusters:
            color = plt.cm.tab20(c%20)
            df = data.loc[c]
            if scatter:
                ax.scatter(*df.values.T, color=color)
            
            m, b, rvalue, pvalue = self.stats.loc[c, outcome]\
                [['slope', 'intercept', 'rvalue', 'pvalue']]
            x = np.array([df[self.treatment].min(), df[self.treatment].max()])
            y = m*x + b

            label = f'{c} ({rvalue:.2f}) {sig(pvalue)}'
            ax.plot(x, y, color=color, lw=lw, label=label)

        plt.legend(loc='upper left', bbox_to_anchor=(1, 1))
        plt.xlabel(self.treatment)
        plt.ylabel(outcome)

        ate = self.average_treatment_effect(outcome, **kwargs)
        default_ate = self.average_treatment_effect(outcome, alpha=1)
        plt.title(f'ATE = {ate:.2f} ({default_ate:.2f})')

    @property
    def controlling_for(self):
        data = self.df.drop(columns=[self.treatment] + self.outcomes)
        return data.assign(cluster=self.clusters)\
            .groupby('cluster')\
            .std()/data.std()

    def overview_controlling_for_pcp(self, outcome, max_cols_pcp=10, ax=None, **kwargs):
        ax = ax or plt.gca()
        
        valid_clusters = self.get_valid_clusters(outcomes=[outcome], **kwargs)
        cf = self.controlling_for.mean().sort_values()
        cf = cf[cf < 1]
        cols = cf.index[-max_cols_pcp:]

        cluster_mask = self.clusters.apply(valid_clusters.__contains__)\
            .sort_values()

        if not cluster_mask.sum():
            warnings.warn('No clusters are valid. Consider increasing alpha or un-excluding clusters')
            return

        if not len(cols):
            warnings.warn('No covariates are controlled by each cluster. Consider passing show_any=True or increase controlling_for_threshold')
            return


        data = plots.reorder(self.df.loc[cluster_mask.index, cols])

        colors = to_rgba_array(
            self.clusters.loc[cluster_mask.index]\
                .apply(plt.cm.tab20)
        )

        colors[~cluster_mask] = .75

        # colors[cluster_mask, -1] = 1
        colors[~cluster_mask, -1] = .25

        return plots.pcp(
            data.rename(columns={c: self.regex.sub('', c) for c in data}),
            colors=colors,
            ax=ax
        )

    def detail_controlling_for(self, cluster_id, threshold=0.25, ax=None, include=[], exclude=[], **kwargs):
        data = self.df.drop(columns=[self.treatment] + self.outcomes)
        u = data.mean()
        s = data.std().replace(0, 1)

        to_plot = ((data - u)/s)\
            .assign(cluster=self.clusters)\
            .reset_index()\
            .melt(id_vars=['location', 'cluster'], var_name='Covariate', value_name='Z-score')

        to_plot['cluster'] = to_plot.cluster == cluster_id

        controlling_for = self.controlling_for
        order = controlling_for.loc[cluster_id]
        valid_features = get_valid(order.to_frame(), max_value=threshold, include=include, exclude=exclude)
        order = order[valid_features]\
            .sort_values()

        return sns.stripplot(
            data=to_plot,
            y='Covariate', x='Z-score', hue='cluster',
            order=order.index,
            dodge=True,
            size=2,
            ax=ax,
            **kwargs
        )    

    def detail_coarsened_set(self, outcome, s=5, n_cols=5, colors=default_correlation_colors):
        cols = [self.treatment, outcome]

        df_clusters = self.stats[outcome]\
            .sort_values('rvalue')

        data = self.df[cols]\
            .astype(float)\
            .set_index(self.clusters)\
            .sort_index()

        n = len(data)
        n_rows = int(np.ceil(n/n_cols))

        plt.figure(figsize=(n_cols*s, n_rows*s))
        for i, yi in enumerate(df_clusters.index):
            ax = plt.subplot(n_rows, n_cols, i + 1)
            p, r = df_clusters.loc[yi, ['pvalue', 'rvalue']]
            plt.title(f'Cluster {i}:  {r:1.1f} {sig(p)}')

            sns.regplot(
                x=self.treatment,
                y=outcome,
                data=data.loc[yi],
                color=colors[int(r > 0)],
                ax=ax,
            )

    def get_valid_clusters(self, outcomes=None, alpha=0.05, **kwargs):
        df = self.stats.swaplevel(axis='columns')['pvalue']
        if outcomes is not None:
            df = df[outcomes]
        return get_valid(df, max_value=alpha, **kwargs)

    def detail_clusters(self,
        s=4,
        rescale=False,
        palette={False: 'lightgray', True: plt.cm.tab10(0)},
        **kwargs
    ):
        valid_clusters = self.get_valid_clusters(**kwargs)

        mask = self.clusters.apply(valid_clusters.__contains__)

        treatment_descr = self.df[mask][self.treatment]\
            .astype(float)\
            .describe()

        outcome_descr = self.df[mask][self.outcomes]\
            .astype(float)\
            .describe()

        n_rows = len(valid_clusters)
        n_cols = 2 + len(self.outcomes)

        plt.figure(figsize=(s*n_cols, s*n_rows))

        for i, ci in enumerate(valid_clusters):
            mask = self.clusters == ci
            
            # stripplot
            ax = plt.subplot(n_rows, n_cols, n_cols*i + 1)
            self.detail_controlling_for(ci, palette=palette, ax=ax)
            ax.legend_.remove()
            
            # dimension reduction plot
            ax = plt.subplot(n_rows, n_cols, n_cols*i + 2)
            sizes = np.array([1, 5])
            colors = np.array([palette[False], palette[True]])

            self.xy.plot.scatter('x', 'y', s=sizes[mask.astype(int)], c=colors[mask.astype(int)], ax=ax)
            plt.xticks([])
            plt.yticks([])
            plt.xlabel('')
            plt.ylabel('')
            plt.title(f'Cluster {ci}')
            
            # regression model plot
            for j, o in enumerate(self.outcomes):
                ax = plt.subplot(n_rows, n_cols, n_cols*i + j + 3)
                sns.regplot(
                    data=self.df[mask].astype(float),
                    x=self.treatment,
                    y=o,
                    color=palette[True]
                )

                p, r = self.stats.loc[ci, o][['pvalue', 'rvalue']]
                plt.title(f'{r:1.1f} {sig(p)}')

                if not rescale:
                    plt.xlim(*treatment_descr.loc[['min', 'max']])
                    plt.ylim(*outcome_descr.loc[['min', 'max'], o])

    def detail_covariates(self, features=None, s=4, ar=1, row_format=None, col_format=None, rescale=False, **kwargs):
        data = self.df_original.set_index(self.clusters, append=True)\
            .swaplevel()

        rows = sorted(self.get_valid_clusters(**kwargs))
        cols = sorted(self.df) if features is None else features

        uniques = {
            k: sorted(data.loc[rows, k].unique())
            for k, v in data.dtypes[features].items()
            if v == 'O'
        }

        descr = data.loc[rows].describe()

        for r, c, ax in grid_from_product(rows, cols, s=s, ar=ar, row_format=row_format, col_format=col_format):
            ser = data.loc[r, c]
            if c in uniques:
                ser = ser.value_counts().sort_index()
                if not rescale:
                    ser = ser.reindex(uniques[c], fill_value=0)
                ser.plot.barh()
            else:
                if not rescale:
                    ser.plot.hist(range=descr.loc[['min', 'max'], c].tolist())
                else:
                    ser.plot.hist()
                    
    def overview(self, outcome, s=12, show_any=False, max_cols_pcp=15, **kwargs):
        plt.figure(figsize=(s, s))

        self.summarize_coarsened_sets_embedding(
            outcome,
            r=.5,
            ax=plt.subplot(221),
            **kwargs
        )

        plt.xlabel('')
        plt.ylabel('')

        self.summarize_coarsened_sets_lmplot(
            outcome,
            ax=plt.subplot(222),
            **kwargs
        )

        self.overview_controlling_for_pcp(
            outcome,
            show_any=show_any,
            max_cols_pcp=max_cols_pcp,
            ax=plt.subplot(212),
            **kwargs
        )

    def average_treatment_effect(self, outcome, **kwargs):
        valid_clusters = self.get_valid_clusters(outcomes=[outcome], **kwargs)
        m = self.stats.loc[valid_clusters, outcome].slope
        n = self.centroids.loc[valid_clusters].n

        return (m*n/n.sum()).sum()

def save_all_plots(df, treatments, outcomes, output_path='./figures', drop_nonzero=False, regex='', **kwargs):
    for t in treatments:
        self = NaturalExperiment(
            df[df[t] > 0] if drop_nonzero else df,
            treatment=t,
            outcomes=outcomes,
            ignore=treatments,
            damping=.5,
            regex=regex
        )

        for o in outcomes:
            self.overview(o, **kwargs)

            if self.get_valid_clusters(outcomes=[o], **kwargs):
                plots.save(output_path, f'{t}-{o}')

            plt.close()